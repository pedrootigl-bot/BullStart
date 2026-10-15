import type { ModuleRequirement, ParsedRequirement, RequirementType, SimpleRule } from "@/lib/access/requirements";

/**
 * Motor de desbloqueio — função pura, sem I/O.
 * Recebe um contexto já carregado e verificado no servidor e decide o acesso a cada módulo.
 * Regra de ouro: na dúvida (dados ausentes, integração indisponível, configuração inválida) o módulo
 * permanece BLOQUEADO.
 */

export type RuleState = "met" | "not_met" | "pending" | "unavailable" | "unlinked" | "invalid";

export type RuleAction = "complete_previous" | "refresh_eligibility" | "deposit" | "contact_support";

export type RuleOutcome = {
  type: RequirementType | "INVALID" | "NONE";
  state: RuleState;
  title: string;
  detail: string;
  actions: RuleAction[];
  requirementKey?: string;
  previousModule?: { id: string; slug: string; title: string; position: number };
  children?: RuleOutcome[];
};

export type EligibilityRecord = {
  status: "eligible" | "not_eligible" | "pending";
  source: "webhook" | "api" | "mock";
  checkedAt: string;
  expiresAt: string | null;
};

export type ModuleSummary = { id: string; slug: string; title: string; position: number };

export type ModuleProgress = { completedRequired: number; totalRequired: number; percent: number };

export type ManualGrant = { status: "granted" | "revoked"; expiresAt: string | null };

export type AccessContext = {
  modules: ModuleSummary[];
  progress: ReadonlyMap<string, ModuleProgress>;
  eligibility: ReadonlyMap<string, EligibilityRecord>;
  manualGrants: ReadonlyMap<string, ManualGrant>;
  brokerLinked: boolean;
  integrationAvailable: boolean;
  acceptMockEligibility: boolean;
  now: Date;
};

export type ModuleAccessResult = {
  moduleId: string;
  unlocked: boolean;
  via: "requirements" | "manual_grant" | null;
  state: RuleState;
  outcomes: RuleOutcome[];
  showDepositCta: boolean;
  canRefreshEligibility: boolean;
};

const DEFAULT_BROKER_LABEL = "Elegibilidade confirmada pela Bullex";

function isActiveGrant(grant: ManualGrant | undefined, now: Date): boolean {
  if (!grant || grant.status !== "granted") return false;
  return grant.expiresAt === null || new Date(grant.expiresAt).getTime() > now.getTime();
}

function previousModuleOf(moduleId: string, ctx: AccessContext): ModuleSummary | null {
  const ordered = [...ctx.modules].sort((a, b) => a.position - b.position);
  const index = ordered.findIndex((m) => m.id === moduleId);
  if (index <= 0) return null;
  return ordered[index - 1] ?? null;
}

function evaluatePreviousModule(
  moduleId: string,
  config: Extract<SimpleRule, { type: "PREVIOUS_MODULE" }>["config"],
  ctx: AccessContext,
): RuleOutcome {
  const previous = previousModuleOf(moduleId, ctx);
  if (!previous) {
    return {
      type: "PREVIOUS_MODULE",
      state: "met",
      title: "Primeiro módulo da formação",
      detail: "Não há módulo anterior a concluir.",
      actions: [],
    };
  }
  const progress = ctx.progress.get(previous.id);
  const percent = progress ? progress.percent : 0;
  const met = percent >= config.min_completion_percent;
  const target = config.min_completion_percent === 100 ? "Conclua" : `Conclua ${config.min_completion_percent}% de`;
  return {
    type: "PREVIOUS_MODULE",
    state: met ? "met" : "not_met",
    title: `${target} o módulo ${String(previous.position).padStart(2, "0")}`,
    detail: met
      ? `Módulo "${previous.title}" concluído.`
      : `Progresso atual em "${previous.title}": ${percent}%.`,
    actions: met ? [] : ["complete_previous"],
    previousModule: previous,
  };
}

function evaluateBrokerEligibility(
  config: Extract<SimpleRule, { type: "BROKER_ELIGIBILITY" }>["config"],
  ctx: AccessContext,
): RuleOutcome {
  const base = {
    type: "BROKER_ELIGIBILITY" as const,
    title: config.label ?? DEFAULT_BROKER_LABEL,
    requirementKey: config.requirement_key,
  };
  const depositAction: RuleAction[] = config.show_deposit_cta ? ["deposit"] : [];

  if (!ctx.brokerLinked) {
    return {
      ...base,
      state: "unlinked",
      detail: "Sua conta Bullex Start ainda não possui vínculo verificado com a corretora.",
      actions: ["contact_support"],
    };
  }

  const record = ctx.eligibility.get(config.requirement_key);
  const usable = record && (record.source !== "mock" || ctx.acceptMockEligibility) ? record : undefined;

  if (!usable) {
    if (!ctx.integrationAvailable) {
      return {
        ...base,
        state: "unavailable",
        detail: "A verificação com a corretora está temporariamente indisponível. Tente novamente mais tarde.",
        actions: ["refresh_eligibility"],
      };
    }
    return {
      ...base,
      state: "pending",
      detail: "Aguardando confirmação da Bullex. Você pode solicitar uma nova verificação.",
      actions: ["refresh_eligibility", ...depositAction],
    };
  }

  const expired = usable.expiresAt !== null && new Date(usable.expiresAt).getTime() <= ctx.now.getTime();

  switch (usable.status) {
    case "eligible":
      if (expired) {
        return {
          ...base,
          state: "pending",
          detail: "A confirmação anterior expirou e precisa ser verificada novamente.",
          actions: ["refresh_eligibility"],
        };
      }
      return { ...base, state: "met", detail: "Requisito confirmado pela corretora.", actions: [] };
    case "not_eligible":
      return {
        ...base,
        state: "not_met",
        detail: "A corretora informou que o requisito ainda não foi atendido.",
        actions: ["refresh_eligibility", ...depositAction],
      };
    case "pending":
      return {
        ...base,
        state: "pending",
        detail: "Aguardando confirmação da Bullex.",
        actions: ["refresh_eligibility", ...depositAction],
      };
    default: {
      const unreachable: never = usable.status;
      return unreachable;
    }
  }
}

function evaluateSimple(moduleId: string, rule: SimpleRule, ctx: AccessContext): RuleOutcome {
  switch (rule.type) {
    case "FREE":
      return {
        type: "FREE",
        state: "met",
        title: "Liberado para alunos autenticados",
        detail: "Acesso incluído na sua conta.",
        actions: [],
      };
    case "PREVIOUS_MODULE":
      return evaluatePreviousModule(moduleId, rule.config, ctx);
    case "BROKER_ELIGIBILITY":
      return evaluateBrokerEligibility(rule.config, ctx);
    case "MANUAL": {
      const met = isActiveGrant(ctx.manualGrants.get(moduleId), ctx.now);
      return {
        type: "MANUAL",
        state: met ? "met" : "not_met",
        title: "Liberação individual",
        detail: met
          ? "Acesso liberado pela equipe Bullex Start."
          : "Este módulo é liberado individualmente pela equipe Bullex Start.",
        actions: met ? [] : ["contact_support"],
      };
    }
    default: {
      const unreachable: never = rule;
      return unreachable;
    }
  }
}

const FAILURE_PRIORITY: RuleState[] = ["unlinked", "unavailable", "pending", "not_met", "invalid"];

function worstState(outcomes: RuleOutcome[]): RuleState {
  for (const state of FAILURE_PRIORITY) {
    if (outcomes.some((o) => o.state === state)) return state;
  }
  return "met";
}

export function evaluateRequirement(moduleId: string, requirement: ModuleRequirement, ctx: AccessContext): RuleOutcome {
  if (requirement.type !== "COMBINED") return evaluateSimple(moduleId, requirement, ctx);

  const children = requirement.config.rules.map((rule) => evaluateSimple(moduleId, rule, ctx));
  const met =
    requirement.config.operator === "AND"
      ? children.every((c) => c.state === "met")
      : children.some((c) => c.state === "met");

  return {
    type: "COMBINED",
    state: met ? "met" : worstState(children.filter((c) => c.state !== "met")),
    title: requirement.config.operator === "AND" ? "Todos os requisitos abaixo" : "Pelo menos um dos requisitos abaixo",
    detail: met ? "Combinação de requisitos atendida." : "Ainda há requisitos pendentes.",
    actions: [...new Set(children.filter((c) => c.state !== "met").flatMap((c) => c.actions))],
    children,
  };
}

/**
 * Vários registros de requisito no mesmo módulo são combinados com AND.
 * Um módulo sem requisitos configurados permanece bloqueado.
 */
export function evaluateModuleAccess(
  moduleId: string,
  requirements: ParsedRequirement[],
  ctx: AccessContext,
): ModuleAccessResult {
  const outcomes: RuleOutcome[] =
    requirements.length === 0
      ? [
          {
            type: "NONE",
            state: "invalid",
            title: "Regras de acesso em configuração",
            detail: "Este módulo ainda não possui regras de liberação publicadas.",
            actions: ["contact_support"],
          },
        ]
      : requirements.map((parsed) =>
          parsed.ok
            ? evaluateRequirement(moduleId, parsed.requirement, ctx)
            : {
                type: "INVALID",
                state: "invalid",
                title: "Regra de acesso indisponível",
                detail: "A regra deste módulo está em revisão pela equipe Bullex Start.",
                actions: ["contact_support"],
              },
        );

  const requirementsMet = outcomes.every((o) => o.state === "met");
  const manual = isActiveGrant(ctx.manualGrants.get(moduleId), ctx.now);
  const unlocked = requirementsMet || manual;

  const pendingActions = outcomes.filter((o) => o.state !== "met").flatMap(collectActions);

  return {
    moduleId,
    unlocked,
    via: requirementsMet ? "requirements" : manual ? "manual_grant" : null,
    state: unlocked ? "met" : worstState(outcomes),
    outcomes,
    showDepositCta: !unlocked && pendingActions.includes("deposit"),
    canRefreshEligibility: !unlocked && pendingActions.includes("refresh_eligibility"),
  };
}

function collectActions(outcome: RuleOutcome): RuleAction[] {
  return [...outcome.actions, ...(outcome.children ?? []).flatMap(collectActions)];
}

export function computeModuleProgress(
  lessons: { id: string; is_required: boolean }[],
  completedLessonIds: ReadonlySet<string>,
): ModuleProgress {
  const required = lessons.filter((l) => l.is_required);
  const completedRequired = required.filter((l) => completedLessonIds.has(l.id)).length;
  const totalRequired = required.length;
  const percent = totalRequired === 0 ? 100 : Math.floor((completedRequired / totalRequired) * 100);
  return { completedRequired, totalRequired, percent };
}
