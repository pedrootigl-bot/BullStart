import { z } from "zod";
import { requirementKeySchema } from "@/lib/access/requirements";

/**
 * Contratos internos da integração com a corretora.
 *
 * Nenhum endpoint da Bullex é assumido aqui: o adapter oficial deve ser implementado
 * quando a documentação e as credenciais oficiais forem disponibilizadas.
 */

export type BrokerMode = "disabled" | "mock" | "official";

export type BrokerCustomer = {
  brokerUserId: string;
  email: string;
  fullName?: string;
  accountStatus?: string;
  verificationStatus?: string;
  registeredAt?: string;
};

export type EligibilityLookup =
  | { status: "eligible" | "not_eligible" | "pending"; expiresAt: string | null }
  | { status: "unavailable"; reason: string };

/** Porta de saída: o que um adapter de corretora precisa saber fazer. */
export interface BrokerApiAdapter {
  readonly mode: BrokerMode;
  /** Indica se é possível consultar a corretora sob demanda. */
  isAvailable(): boolean;
  fetchCustomer(brokerUserId: string): Promise<BrokerCustomer | null>;
  fetchEligibility(brokerUserId: string, requirementKey: string): Promise<EligibilityLookup>;
  /** URL de depósito montada pela integração oficial, quando existir. */
  buildDepositUrl(brokerUserId: string): Promise<string | null>;
}

// ---------------------------------------------------------------------------
// Eventos recebidos (webhook) — contrato PROPOSTO, a ser alinhado com a Bullex
// ---------------------------------------------------------------------------

const isoDate = z.iso.datetime({ offset: true });

export const customerUpsertedEventSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.literal("customer.upserted"),
  occurred_at: isoDate,
  data: z.object({
    broker_user_id: z.string().min(1).max(128),
    email: z.email().max(320),
    full_name: z.string().max(120).optional(),
    account_status: z.string().max(40).optional(),
    verification_status: z.string().max(40).optional(),
    registered_at: isoDate.optional(),
  }),
});

export const eligibilityUpdatedEventSchema = z.object({
  id: z.string().min(1).max(200),
  type: z.literal("eligibility.updated"),
  occurred_at: isoDate,
  data: z.object({
    broker_user_id: z.string().min(1).max(128),
    requirement_key: requirementKeySchema,
    status: z.enum(["eligible", "not_eligible", "pending"]),
    expires_at: isoDate.nullable().optional(),
  }),
});

export const brokerEventSchema = z.discriminatedUnion("type", [
  customerUpsertedEventSchema,
  eligibilityUpdatedEventSchema,
]);

export type CustomerUpsertedEvent = z.infer<typeof customerUpsertedEventSchema>;
export type EligibilityUpdatedEvent = z.infer<typeof eligibilityUpdatedEventSchema>;
export type BrokerEvent = z.infer<typeof brokerEventSchema>;

export type SyncResult =
  | { status: "processed"; detail: string }
  | { status: "ignored"; detail: string };
