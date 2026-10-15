import { describe, expect, it } from "vitest";
import { computeModuleProgress, evaluateModuleAccess, type AccessContext, type EligibilityRecord } from "@/lib/access/engine";
import { parseRequirement, type ParsedRequirement } from "@/lib/access/requirements";

const modules = [
  { id: "m1", slug: "m1", title: "Módulo 1", position: 1 },
  { id: "m2", slug: "m2", title: "Módulo 2", position: 2 },
  { id: "m3", slug: "m3", title: "Módulo 3", position: 3 },
];

function ctx(overrides: Partial<AccessContext> = {}): AccessContext {
  return {
    modules,
    progress: new Map([
      ["m1", { completedRequired: 0, totalRequired: 4, percent: 0 }],
      ["m2", { completedRequired: 0, totalRequired: 4, percent: 0 }],
    ]),
    eligibility: new Map(),
    manualGrants: new Map(),
    brokerLinked: true,
    integrationAvailable: true,
    acceptMockEligibility: false,
    now: new Date("2026-10-13T12:00:00Z"),
    ...overrides,
  };
}

function rule(type: string, config: Record<string, unknown>): ParsedRequirement {
  return parseRequirement({ id: crypto.randomUUID(), requirement_type: type, config_json: { version: 1, ...config } });
}

const broker = (extra: Record<string, unknown> = {}) =>
  rule("BROKER_ELIGIBILITY", { requirement_key: "account_funding_confirmed", show_deposit_cta: true, ...extra });

const eligible = (overrides: Partial<EligibilityRecord> = {}): Map<string, EligibilityRecord> =>
  new Map([["account_funding_confirmed", { status: "eligible", source: "webhook", checkedAt: "2026-10-13T10:00:00Z", expiresAt: null, ...overrides }]]);

describe("evaluateModuleAccess", () => {
  it("libera módulo FREE", () => {
    const result = evaluateModuleAccess("m1", [rule("FREE", {})], ctx());
    expect(result.unlocked).toBe(true);
    expect(result.via).toBe("requirements");
  });

  it("mantém bloqueado módulo sem regras (fail-closed)", () => {
    const result = evaluateModuleAccess("m2", [], ctx());
    expect(result.unlocked).toBe(false);
    expect(result.state).toBe("invalid");
  });

  it("mantém bloqueado quando a configuração é inválida", () => {
    const invalid = parseRequirement({ id: "x", requirement_type: "BROKER_ELIGIBILITY", config_json: { version: 1 } });
    expect(invalid.ok).toBe(false);
    expect(evaluateModuleAccess("m3", [invalid], ctx()).unlocked).toBe(false);
  });

  it("PREVIOUS_MODULE exige o percentual configurado do módulo anterior", () => {
    const requirement = [rule("PREVIOUS_MODULE", { min_completion_percent: 100 })];
    expect(evaluateModuleAccess("m2", requirement, ctx()).unlocked).toBe(false);
    const done = ctx({ progress: new Map([["m1", { completedRequired: 4, totalRequired: 4, percent: 100 }]]) });
    expect(evaluateModuleAccess("m2", requirement, done).unlocked).toBe(true);
  });

  it("BROKER_ELIGIBILITY: sem vínculo resulta em unlinked", () => {
    const result = evaluateModuleAccess("m3", [broker()], ctx({ brokerLinked: false, eligibility: eligible() }));
    expect(result.unlocked).toBe(false);
    expect(result.state).toBe("unlinked");
  });

  it("BROKER_ELIGIBILITY: sem registro e integração indisponível resulta em unavailable (nunca libera)", () => {
    const result = evaluateModuleAccess("m3", [broker()], ctx({ integrationAvailable: false }));
    expect(result.unlocked).toBe(false);
    expect(result.state).toBe("unavailable");
  });

  it("BROKER_ELIGIBILITY: pendente oferece verificação e CTA de depósito configurado", () => {
    const result = evaluateModuleAccess("m3", [broker()], ctx());
    expect(result.state).toBe("pending");
    expect(result.canRefreshEligibility).toBe(true);
    expect(result.showDepositCta).toBe(true);
  });

  it("BROKER_ELIGIBILITY: não mostra CTA de depósito quando a regra não pede", () => {
    const result = evaluateModuleAccess("m3", [broker({ show_deposit_cta: false })], ctx());
    expect(result.showDepositCta).toBe(false);
  });

  it("BROKER_ELIGIBILITY: libera com confirmação oficial válida", () => {
    expect(evaluateModuleAccess("m3", [broker()], ctx({ eligibility: eligible() })).unlocked).toBe(true);
  });

  it("BROKER_ELIGIBILITY: confirmação expirada volta a pendente", () => {
    const result = evaluateModuleAccess("m3", [broker()], ctx({ eligibility: eligible({ expiresAt: "2026-10-01T00:00:00Z" }) }));
    expect(result.unlocked).toBe(false);
    expect(result.state).toBe("pending");
  });

  it("ignora elegibilidade de origem mock quando não permitida (produção)", () => {
    const result = evaluateModuleAccess("m3", [broker()], ctx({ eligibility: eligible({ source: "mock" }), acceptMockEligibility: false }));
    expect(result.unlocked).toBe(false);
    const dev = evaluateModuleAccess("m3", [broker()], ctx({ eligibility: eligible({ source: "mock" }), acceptMockEligibility: true }));
    expect(dev.unlocked).toBe(true);
  });

  it("not_eligible mantém bloqueado", () => {
    const result = evaluateModuleAccess("m3", [broker()], ctx({ eligibility: eligible({ status: "not_eligible" }) }));
    expect(result.unlocked).toBe(false);
    expect(result.state).toBe("not_met");
  });

  it("COMBINED AND exige todas as sub-regras", () => {
    const combined = rule("COMBINED", {
      operator: "AND",
      rules: [
        { type: "PREVIOUS_MODULE", config: { version: 1, min_completion_percent: 100 } },
        { type: "BROKER_ELIGIBILITY", config: { version: 1, requirement_key: "account_funding_confirmed", show_deposit_cta: false } },
      ],
    });
    const onlyBroker = ctx({ eligibility: eligible() });
    expect(evaluateModuleAccess("m3", [combined], onlyBroker).unlocked).toBe(false);
    const both = ctx({ eligibility: eligible(), progress: new Map([["m2", { completedRequired: 4, totalRequired: 4, percent: 100 }]]) });
    expect(evaluateModuleAccess("m3", [combined], both).unlocked).toBe(true);
  });

  it("COMBINED OR libera com uma sub-regra atendida", () => {
    const combined = rule("COMBINED", {
      operator: "OR",
      rules: [
        { type: "MANUAL", config: { version: 1 } },
        { type: "BROKER_ELIGIBILITY", config: { version: 1, requirement_key: "account_funding_confirmed", show_deposit_cta: false } },
      ],
    });
    expect(evaluateModuleAccess("m3", [combined], ctx({ eligibility: eligible() })).unlocked).toBe(true);
  });

  it("múltiplas regras no módulo são combinadas com AND", () => {
    const rules = [rule("FREE", {}), broker()];
    expect(evaluateModuleAccess("m3", rules, ctx()).unlocked).toBe(false);
  });

  it("liberação manual ativa sobrepõe regras; expirada ou revogada não", () => {
    const rules = [rule("MANUAL", {})];
    const active = ctx({ manualGrants: new Map([["m3", { status: "granted", expiresAt: null }]]) });
    const result = evaluateModuleAccess("m3", [broker()], active);
    expect(result.unlocked).toBe(true);
    expect(result.via).toBe("manual_grant");
    expect(evaluateModuleAccess("m3", rules, active).unlocked).toBe(true);

    const expired = ctx({ manualGrants: new Map([["m3", { status: "granted", expiresAt: "2026-10-12T00:00:00Z" }]]) });
    expect(evaluateModuleAccess("m3", rules, expired).unlocked).toBe(false);
    const revoked = ctx({ manualGrants: new Map([["m3", { status: "revoked", expiresAt: null }]]) });
    expect(evaluateModuleAccess("m3", rules, revoked).unlocked).toBe(false);
  });
});

describe("computeModuleProgress", () => {
  it("considera apenas aulas obrigatórias", () => {
    const lessons = [
      { id: "a", is_required: true },
      { id: "b", is_required: true },
      { id: "c", is_required: false },
    ];
    expect(computeModuleProgress(lessons, new Set(["a", "c"]))).toEqual({ completedRequired: 1, totalRequired: 2, percent: 50 });
  });

  it("arredonda para baixo (nunca indica 100% antes da hora)", () => {
    const lessons = [{ id: "a", is_required: true }, { id: "b", is_required: true }, { id: "c", is_required: true }];
    expect(computeModuleProgress(lessons, new Set(["a", "b"])).percent).toBe(66);
  });
});
