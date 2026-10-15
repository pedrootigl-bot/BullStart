import { z } from "zod";

/**
 * Schemas versionados de module_requirements.config_json.
 * Para evoluir um tipo, adicione uma nova versão à união (ex.: version 2) e trate-a no motor;
 * registros antigos continuam válidos.
 */

export const requirementKeySchema = z
  .string()
  .regex(/^[a-z0-9_]{3,64}$/, "Use de 3 a 64 caracteres: letras minúsculas, números e _");

export const freeConfigSchema = z.object({ version: z.literal(1) }).strict();

export const previousModuleConfigSchema = z
  .object({
    version: z.literal(1),
    min_completion_percent: z.number().int().min(1).max(100).default(100),
  })
  .strict();

export const brokerEligibilityConfigSchema = z
  .object({
    version: z.literal(1),
    requirement_key: requirementKeySchema,
    label: z.string().trim().min(3).max(140).optional(),
    show_deposit_cta: z.boolean().default(false),
  })
  .strict();

export const manualConfigSchema = z.object({ version: z.literal(1) }).strict();

export const simpleRuleSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("FREE"), config: freeConfigSchema }).strict(),
  z.object({ type: z.literal("PREVIOUS_MODULE"), config: previousModuleConfigSchema }).strict(),
  z.object({ type: z.literal("BROKER_ELIGIBILITY"), config: brokerEligibilityConfigSchema }).strict(),
  z.object({ type: z.literal("MANUAL"), config: manualConfigSchema }).strict(),
]);

export const combinedConfigSchema = z
  .object({
    version: z.literal(1),
    operator: z.enum(["AND", "OR"]).default("AND"),
    rules: z.array(simpleRuleSchema).min(2).max(6),
  })
  .strict();

export type SimpleRule = z.infer<typeof simpleRuleSchema>;

export type ModuleRequirement =
  | SimpleRule
  | { type: "COMBINED"; config: z.infer<typeof combinedConfigSchema> };

export type RequirementType = ModuleRequirement["type"];

export const REQUIREMENT_TYPES = ["FREE", "PREVIOUS_MODULE", "BROKER_ELIGIBILITY", "MANUAL", "COMBINED"] as const;

export type ParsedRequirement =
  | { ok: true; id: string; requirement: ModuleRequirement }
  | { ok: false; id: string; type: string; issue: string };

export function parseRequirement(row: { id: string; requirement_type: string; config_json: unknown }): ParsedRequirement {
  const type = row.requirement_type as RequirementType;
  const fail = (issue: string): ParsedRequirement => ({ ok: false, id: row.id, type: row.requirement_type, issue });

  switch (type) {
    case "FREE": {
      const parsed = freeConfigSchema.safeParse(row.config_json);
      return parsed.success ? { ok: true, id: row.id, requirement: { type, config: parsed.data } } : fail(parsed.error.message);
    }
    case "PREVIOUS_MODULE": {
      const parsed = previousModuleConfigSchema.safeParse(row.config_json);
      return parsed.success ? { ok: true, id: row.id, requirement: { type, config: parsed.data } } : fail(parsed.error.message);
    }
    case "BROKER_ELIGIBILITY": {
      const parsed = brokerEligibilityConfigSchema.safeParse(row.config_json);
      return parsed.success ? { ok: true, id: row.id, requirement: { type, config: parsed.data } } : fail(parsed.error.message);
    }
    case "MANUAL": {
      const parsed = manualConfigSchema.safeParse(row.config_json);
      return parsed.success ? { ok: true, id: row.id, requirement: { type, config: parsed.data } } : fail(parsed.error.message);
    }
    case "COMBINED": {
      const parsed = combinedConfigSchema.safeParse(row.config_json);
      return parsed.success ? { ok: true, id: row.id, requirement: { type, config: parsed.data } } : fail(parsed.error.message);
    }
    default: {
      const unknownType: never = type;
      return fail(`Tipo de requisito desconhecido: ${String(unknownType)}`);
    }
  }
}

/** Valida um requisito vindo do painel administrativo antes de persistir. */
export function validateRequirementInput(input: { type: string; config: unknown }) {
  const parsed = parseRequirement({ id: "input", requirement_type: input.type, config_json: input.config });
  return parsed;
}

export function brokerKeysOf(requirement: ModuleRequirement): string[] {
  switch (requirement.type) {
    case "BROKER_ELIGIBILITY":
      return [requirement.config.requirement_key];
    case "COMBINED":
      return requirement.config.rules.flatMap(brokerKeysOf);
    case "FREE":
    case "PREVIOUS_MODULE":
    case "MANUAL":
      return [];
    default: {
      const unreachable: never = requirement;
      return unreachable;
    }
  }
}

export function describeRequirementType(type: RequirementType): string {
  switch (type) {
    case "FREE":
      return "Liberado para alunos autenticados";
    case "PREVIOUS_MODULE":
      return "Conclusão do módulo anterior";
    case "BROKER_ELIGIBILITY":
      return "Elegibilidade confirmada pela Bullex";
    case "MANUAL":
      return "Liberação individual pelo administrador";
    case "COMBINED":
      return "Combinação de requisitos";
    default: {
      const unreachable: never = type;
      return unreachable;
    }
  }
}
