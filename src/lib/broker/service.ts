import "server-only";
import { DisabledBrokerAdapter, MockBrokerAdapter, OfficialBrokerAdapter } from "@/lib/broker/adapters";
import { validateOfficialUrl } from "@/lib/broker/deposit-url";
import type {
  BrokerApiAdapter,
  BrokerMode,
  CustomerUpsertedEvent,
  EligibilityLookup,
  EligibilityUpdatedEvent,
  SyncResult,
} from "@/lib/broker/types";
import { recordAudit } from "@/lib/audit";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin, type AppSupabaseClient } from "@/lib/supabase/admin";

export type BrokerProfile = {
  linked: boolean;
  brokerUserId: string | null;
  accountStatus: string | null;
  verificationStatus: string | null;
  registeredAt: string | null;
  linkedAt: string | null;
  lastSyncedAt: string | null;
};

type ServiceOptions = {
  acceptMockEligibility: boolean;
  depositUrl: string | undefined;
  allowedDepositHosts: string[];
};

/**
 * BrokerIntegrationService — única porta de entrada para dados da corretora.
 * Toda informação de vínculo/elegibilidade gravada aqui vem de evento assinado ou de adapter
 * server-side; nunca de dados enviados pelo navegador.
 */
export class BrokerIntegrationService {
  constructor(
    private readonly adapter: BrokerApiAdapter,
    private readonly db: AppSupabaseClient,
    private readonly options: ServiceOptions,
  ) {}

  get mode(): BrokerMode {
    return this.adapter.mode;
  }

  get acceptsMockEligibility(): boolean {
    return this.options.acceptMockEligibility;
  }

  isAvailable(): boolean {
    return this.adapter.isAvailable();
  }

  async getAuthenticatedBrokerProfile(userId: string): Promise<BrokerProfile> {
    const { data } = await this.db
      .from("profiles")
      .select("broker_user_id, broker_account_status, broker_verification_status, broker_registered_at, broker_linked_at, broker_last_synced_at")
      .eq("id", userId)
      .maybeSingle();

    return {
      linked: Boolean(data?.broker_user_id),
      brokerUserId: data?.broker_user_id ?? null,
      accountStatus: data?.broker_account_status ?? null,
      verificationStatus: data?.broker_verification_status ?? null,
      registeredAt: data?.broker_registered_at ?? null,
      linkedAt: data?.broker_linked_at ?? null,
      lastSyncedAt: data?.broker_last_synced_at ?? null,
    };
  }

  /**
   * Retorna a elegibilidade verificada. Com `refresh`, consulta o adapter (se disponível) e
   * persiste o resultado. Falhas nunca resultam em elegibilidade positiva.
   */
  async getBrokerEligibility(
    userId: string,
    requirementKey: string,
    { refresh = false }: { refresh?: boolean } = {},
  ): Promise<EligibilityLookup> {
    const profile = await this.getAuthenticatedBrokerProfile(userId);
    if (!profile.linked || !profile.brokerUserId) return { status: "unavailable", reason: "unlinked" };

    const { data: existing } = await this.db
      .from("broker_eligibility")
      .select("eligibility_status, source, expires_at")
      .eq("user_id", userId)
      .eq("requirement_key", requirementKey)
      .maybeSingle();

    const existingUsable =
      existing && (existing.source !== "mock" || this.options.acceptMockEligibility) ? existing : null;

    if (!refresh && existingUsable) {
      return { status: existingUsable.eligibility_status, expiresAt: existingUsable.expires_at };
    }

    if (!this.adapter.isAvailable()) {
      return existingUsable
        ? { status: existingUsable.eligibility_status, expiresAt: existingUsable.expires_at }
        : { status: "unavailable", reason: "integration_unavailable" };
    }

    let lookup: EligibilityLookup;
    try {
      lookup = await this.adapter.fetchEligibility(profile.brokerUserId, requirementKey);
    } catch (error) {
      console.error("[broker] falha ao consultar elegibilidade", error instanceof Error ? error.message : error);
      return { status: "unavailable", reason: "integration_error" };
    }
    if (lookup.status === "unavailable") return lookup;

    const { error } = await this.db.from("broker_eligibility").upsert(
      {
        user_id: userId,
        requirement_key: requirementKey,
        eligibility_status: lookup.status,
        source: this.adapter.mode === "mock" ? "mock" : "api",
        source_event_id: null,
        checked_at: new Date().toISOString(),
        expires_at: lookup.expiresAt,
      },
      { onConflict: "user_id,requirement_key" },
    );
    if (error) {
      console.error("[broker] falha ao persistir elegibilidade", error.message);
      return { status: "unavailable", reason: "persistence_error" };
    }

    await this.db.from("profiles").update({ broker_last_synced_at: new Date().toISOString() }).eq("id", userId);
    return lookup;
  }

  /** Processa criação/atualização de cliente vinda da corretora (evento já autenticado). */
  async syncBrokerCustomer(event: CustomerUpsertedEvent): Promise<SyncResult> {
    const { data: payload } = event;
    const occurredAt = new Date(event.occurred_at).toISOString();
    const brokerFields = {
      broker_account_status: payload.account_status ?? null,
      broker_verification_status: payload.verification_status ?? null,
      broker_registered_at: payload.registered_at ?? null,
      broker_last_synced_at: occurredAt,
    };

    const { data: linkedProfile } = await this.db
      .from("profiles")
      .select("id, broker_last_synced_at")
      .eq("broker_user_id", payload.broker_user_id)
      .maybeSingle();

    if (linkedProfile) {
      if (linkedProfile.broker_last_synced_at && new Date(linkedProfile.broker_last_synced_at) > new Date(occurredAt)) {
        return { status: "ignored", detail: "stale_event" };
      }
      await this.db.from("profiles").update(brokerFields).eq("id", linkedProfile.id);
      return { status: "processed", detail: "customer_updated" };
    }

    const { data: candidate } = await this.db
      .from("profiles")
      .select("id, auth_user_id, broker_user_id")
      .eq("email", payload.email.toLowerCase())
      .maybeSingle();

    if (!candidate) return { status: "ignored", detail: "no_matching_profile" };
    if (candidate.broker_user_id) return { status: "ignored", detail: "link_conflict" };

    // O vínculo por e-mail só é aceito se o e-mail do aluno foi verificado na Bull Academy;
    // caso contrário alguém poderia se cadastrar com o e-mail de terceiros e herdar o vínculo.
    const { data: authUser } = await this.db.auth.admin.getUserById(candidate.auth_user_id);
    if (!authUser.user?.email_confirmed_at) return { status: "ignored", detail: "email_not_verified" };

    const { error } = await this.db
      .from("profiles")
      .update({ ...brokerFields, broker_user_id: payload.broker_user_id, broker_linked_at: new Date().toISOString() })
      .eq("id", candidate.id)
      .is("broker_user_id", null);
    if (error) return { status: "ignored", detail: "link_conflict" };

    await recordAudit({
      actorId: null,
      action: "broker.customer_linked",
      entityType: "profile",
      entityId: candidate.id,
      metadata: { event_id: event.id },
    });
    return { status: "processed", detail: "customer_linked" };
  }

  /** Processa atualização de elegibilidade confirmada pela corretora (evento já autenticado). */
  async syncEligibilityEvent(event: EligibilityUpdatedEvent): Promise<SyncResult> {
    const { data: payload } = event;
    const occurredAt = new Date(event.occurred_at).toISOString();

    const { data: profile } = await this.db
      .from("profiles")
      .select("id")
      .eq("broker_user_id", payload.broker_user_id)
      .maybeSingle();
    if (!profile) return { status: "ignored", detail: "unknown_customer" };

    const { data: existing } = await this.db
      .from("broker_eligibility")
      .select("checked_at, source")
      .eq("user_id", profile.id)
      .eq("requirement_key", payload.requirement_key)
      .maybeSingle();

    if (existing && existing.source !== "mock" && new Date(existing.checked_at) > new Date(occurredAt)) {
      return { status: "ignored", detail: "stale_event" };
    }

    const { error } = await this.db.from("broker_eligibility").upsert(
      {
        user_id: profile.id,
        requirement_key: payload.requirement_key,
        eligibility_status: payload.status,
        source: "webhook",
        source_event_id: event.id,
        checked_at: occurredAt,
        expires_at: payload.expires_at ?? null,
      },
      { onConflict: "user_id,requirement_key" },
    );
    if (error) throw new Error(`eligibility_upsert_failed: ${error.message}`);

    await this.db.from("profiles").update({ broker_last_synced_at: new Date().toISOString() }).eq("id", profile.id);
    await recordAudit({
      actorId: null,
      action: "broker.eligibility_updated",
      entityType: "profile",
      entityId: profile.id,
      metadata: { event_id: event.id, requirement_key: payload.requirement_key, status: payload.status },
    });
    return { status: "processed", detail: "eligibility_updated" };
  }

  /** Destino de depósito: somente URL oficial, https e em host explicitamente autorizado. */
  async getOfficialDepositUrl(userId: string): Promise<string | null> {
    const profile = await this.getAuthenticatedBrokerProfile(userId);
    if (profile.linked && profile.brokerUserId) {
      try {
        const fromAdapter = await this.adapter.buildDepositUrl(profile.brokerUserId);
        const validated = validateOfficialUrl(fromAdapter, this.options.allowedDepositHosts);
        if (validated) return validated;
      } catch (error) {
        console.error("[broker] falha ao montar URL de depósito", error instanceof Error ? error.message : error);
      }
    }
    return validateOfficialUrl(this.options.depositUrl, this.options.allowedDepositHosts);
  }

  isDepositConfigured(): boolean {
    return validateOfficialUrl(this.options.depositUrl, this.options.allowedDepositHosts) !== null;
  }
}

function createAdapter(): BrokerApiAdapter {
  const env = getEnv();
  const mode = env.BROKER_INTEGRATION_MODE;
  switch (mode) {
    case "mock":
      if (env.NODE_ENV === "production") {
        console.error("[broker] BROKER_INTEGRATION_MODE=mock é proibido em produção; integração desativada.");
        return new DisabledBrokerAdapter();
      }
      return new MockBrokerAdapter(env.BROKER_MOCK_ELIGIBLE_KEYS);
    case "official":
      return new OfficialBrokerAdapter();
    case "disabled":
      return new DisabledBrokerAdapter();
    default: {
      const unreachable: never = mode;
      throw new Error(`Modo de integração desconhecido: ${String(unreachable)}`);
    }
  }
}

let service: BrokerIntegrationService | null = null;

export function getBrokerIntegration(): BrokerIntegrationService {
  if (service) return service;
  const env = getEnv();
  service = new BrokerIntegrationService(createAdapter(), getSupabaseAdmin(), {
    acceptMockEligibility: env.NODE_ENV !== "production",
    depositUrl: env.BROKER_OFFICIAL_DEPOSIT_URL,
    allowedDepositHosts: env.BROKER_OFFICIAL_ALLOWED_HOSTS,
  });
  return service;
}
