import type { BrokerApiAdapter, BrokerCustomer, EligibilityLookup } from "@/lib/broker/types";

/**
 * Sem integração ativa: nunca confirma elegibilidade. A elegibilidade só chega por webhook assinado.
 */
export class DisabledBrokerAdapter implements BrokerApiAdapter {
  readonly mode = "disabled" as const;

  isAvailable(): boolean {
    return false;
  }

  async fetchCustomer(): Promise<BrokerCustomer | null> {
    return null;
  }

  async fetchEligibility(): Promise<EligibilityLookup> {
    return { status: "unavailable", reason: "integration_disabled" };
  }

  async buildDepositUrl(): Promise<string | null> {
    return null;
  }
}

/**
 * Adapter oficial — PENDENTE.
 * Implementar quando a Bullex fornecer documentação, credenciais e ambiente de homologação.
 * Até lá responde como indisponível (status seguro), sem inventar endpoints.
 */
export class OfficialBrokerAdapter implements BrokerApiAdapter {
  readonly mode = "official" as const;

  isAvailable(): boolean {
    return false;
  }

  async fetchCustomer(): Promise<BrokerCustomer | null> {
    return null;
  }

  async fetchEligibility(): Promise<EligibilityLookup> {
    return { status: "unavailable", reason: "official_adapter_not_configured" };
  }

  async buildDepositUrl(): Promise<string | null> {
    return null;
  }
}

/**
 * Adapter MOCK — exclusivo para desenvolvimento local.
 * O factory recusa este adapter quando NODE_ENV=production e o motor de acesso ignora
 * registros com origem "mock" em produção.
 */
export class MockBrokerAdapter implements BrokerApiAdapter {
  readonly mode = "mock" as const;

  constructor(private readonly eligibleKeys: string[]) {}

  isAvailable(): boolean {
    return true;
  }

  async fetchCustomer(brokerUserId: string): Promise<BrokerCustomer | null> {
    return {
      brokerUserId,
      email: "",
      accountStatus: "active",
      verificationStatus: "verified",
    };
  }

  async fetchEligibility(_brokerUserId: string, requirementKey: string): Promise<EligibilityLookup> {
    return {
      status: this.eligibleKeys.includes(requirementKey.toLowerCase()) ? "eligible" : "not_eligible",
      expiresAt: null,
    };
  }

  async buildDepositUrl(): Promise<string | null> {
    return null;
  }
}
