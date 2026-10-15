"use client";

import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { saveModuleRequirementsAction } from "@/lib/admin/content-actions";

type SimpleType = "FREE" | "PREVIOUS_MODULE" | "BROKER_ELIGIBILITY" | "MANUAL";
type RuleType = SimpleType | "COMBINED";

export type EditorRule = {
  key: string;
  type: RuleType;
  minPercent: string;
  requirementKey: string;
  label: string;
  showDepositCta: boolean;
  operator: "AND" | "OR";
  rules: EditorRule[];
};

export type StoredRequirement = { requirement_type: string; config_json: unknown };

const TYPE_LABEL: Record<RuleType, string> = {
  FREE: "Livre (aluno autenticado)",
  PREVIOUS_MODULE: "Conclusão do módulo anterior",
  BROKER_ELIGIBILITY: "Elegibilidade confirmada pela Bullex",
  MANUAL: "Somente liberação manual",
  COMBINED: "Combinação de regras",
};

const SIMPLE_TYPES: SimpleType[] = ["FREE", "PREVIOUS_MODULE", "BROKER_ELIGIBILITY", "MANUAL"];

function newRule(type: RuleType = "PREVIOUS_MODULE"): EditorRule {
  return {
    key: crypto.randomUUID(),
    type,
    minPercent: "100",
    requirementKey: "",
    label: "",
    showDepositCta: false,
    operator: "AND",
    rules: type === "COMBINED" ? [newRule("PREVIOUS_MODULE"), newRule("BROKER_ELIGIBILITY")] : [],
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function fromStored(type: string, configValue: unknown): EditorRule {
  const config = asRecord(configValue);
  const rule = newRule(type as RuleType);
  rule.minPercent = String(config.min_completion_percent ?? 100);
  rule.requirementKey = typeof config.requirement_key === "string" ? config.requirement_key : "";
  rule.label = typeof config.label === "string" ? config.label : "";
  rule.showDepositCta = config.show_deposit_cta === true;
  if (type === "COMBINED") {
    rule.operator = config.operator === "OR" ? "OR" : "AND";
    rule.rules = Array.isArray(config.rules)
      ? config.rules.map((item) => {
          const sub = asRecord(item);
          return fromStored(String(sub.type ?? "FREE"), sub.config);
        })
      : [];
  }
  return rule;
}

function toConfig(rule: EditorRule): Record<string, unknown> {
  switch (rule.type) {
    case "FREE":
    case "MANUAL":
      return { version: 1 };
    case "PREVIOUS_MODULE":
      return { version: 1, min_completion_percent: Number(rule.minPercent) };
    case "BROKER_ELIGIBILITY":
      return {
        version: 1,
        requirement_key: rule.requirementKey.trim(),
        ...(rule.label.trim() ? { label: rule.label.trim() } : {}),
        show_deposit_cta: rule.showDepositCta,
      };
    case "COMBINED":
      return {
        version: 1,
        operator: rule.operator,
        rules: rule.rules.map((sub) => ({ type: sub.type, config: toConfig(sub) })),
      };
    default: {
      const unreachable: never = rule.type;
      return unreachable;
    }
  }
}

function RuleFields({ rule, onChange, allowCombined, idPrefix }: { rule: EditorRule; onChange: (rule: EditorRule) => void; allowCombined: boolean; idPrefix: string }) {
  const types: RuleType[] = allowCombined ? [...SIMPLE_TYPES, "COMBINED"] : SIMPLE_TYPES;
  const set = (patch: Partial<EditorRule>) => onChange({ ...rule, ...patch });

  return (
    <div className="flex flex-col gap-3">
      <Field label="Tipo de regra" htmlFor={`${idPrefix}-type`}>
        <Select
          id={`${idPrefix}-type`}
          value={rule.type}
          onChange={(e) => {
            const type = e.target.value as RuleType;
            onChange({ ...newRule(type), key: rule.key, requirementKey: rule.requirementKey, label: rule.label });
          }}
        >
          {types.map((type) => (
            <option key={type} value={type}>
              {TYPE_LABEL[type]}
            </option>
          ))}
        </Select>
      </Field>

      {rule.type === "PREVIOUS_MODULE" && (
        <Field label="Percentual mínimo do módulo anterior" htmlFor={`${idPrefix}-pct`}>
          <Input id={`${idPrefix}-pct`} type="number" min={1} max={100} value={rule.minPercent} onChange={(e) => set({ minPercent: e.target.value })} />
        </Field>
      )}

      {rule.type === "BROKER_ELIGIBILITY" && (
        <>
          <Field
            label="Chave do requisito (requirement_key)"
            htmlFor={`${idPrefix}-key`}
            hint="Deve corresponder à chave enviada pela Bullex nos eventos de elegibilidade. Ex.: account_funding_confirmed"
          >
            <Input
              id={`${idPrefix}-key`}
              value={rule.requirementKey}
              onChange={(e) => set({ requirementKey: e.target.value.toLowerCase() })}
              pattern="[a-z0-9_]{3,64}"
              required
              className="font-mono"
            />
          </Field>
          <Field label="Descrição exibida ao aluno (opcional)" htmlFor={`${idPrefix}-label`}>
            <Input id={`${idPrefix}-label`} value={rule.label} maxLength={140} onChange={(e) => set({ label: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2.5 text-sm text-mist-200">
            <Checkbox checked={rule.showDepositCta} onChange={(e) => set({ showDepositCta: e.target.checked })} />
            Exibir botão para a área oficial de depósito (com aviso de risco)
          </label>
        </>
      )}

      {rule.type === "MANUAL" && (
        <p className="text-xs text-mist-500">O módulo só abre para alunos com liberação manual registrada na página do aluno.</p>
      )}

      {rule.type === "COMBINED" && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] p-4">
          <Field label="Operador" htmlFor={`${idPrefix}-op`}>
            <Select id={`${idPrefix}-op`} value={rule.operator} onChange={(e) => set({ operator: e.target.value === "OR" ? "OR" : "AND" })}>
              <option value="AND">Todas as regras (E)</option>
              <option value="OR">Qualquer uma das regras (OU)</option>
            </Select>
          </Field>
          {rule.rules.map((sub, index) => (
            <div key={sub.key} className="rounded-lg bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-mist-400">Sub-regra {index + 1}</p>
                <button
                  type="button"
                  disabled={rule.rules.length <= 2}
                  className="rounded p-1 text-mist-500 hover:text-danger-400 disabled:opacity-40"
                  aria-label={`Remover sub-regra ${index + 1}`}
                  onClick={() => set({ rules: rule.rules.filter((r) => r.key !== sub.key) })}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <RuleFields
                rule={sub}
                allowCombined={false}
                idPrefix={`${idPrefix}-${index}`}
                onChange={(next) => set({ rules: rule.rules.map((r) => (r.key === sub.key ? next : r)) })}
              />
            </div>
          ))}
          <Button variant="ghost" size="sm" disabled={rule.rules.length >= 6} onClick={() => set({ rules: [...rule.rules, newRule("FREE")] })}>
            <Plus className="size-4" aria-hidden="true" /> Adicionar sub-regra
          </Button>
        </div>
      )}
    </div>
  );
}

export function RequirementsEditor({ moduleId, initial, onSaved }: { moduleId: string; initial: StoredRequirement[]; onSaved: () => void }) {
  const [rules, setRules] = useState<EditorRule[]>(() => initial.map((r) => fromStored(r.requirement_type, r.config_json)));
  const { pending, run } = useAdminAction();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(
          () => saveModuleRequirementsAction({ moduleId, rules: rules.map((rule) => ({ type: rule.type, config: toConfig(rule) })) }),
          { onSuccess: onSaved },
        );
      }}
    >
      <p className="text-sm text-mist-400">
        Todas as regras listadas precisam ser atendidas (E). Módulos sem regras ficam bloqueados. A validação acontece
        sempre no servidor.
      </p>
      {rules.length === 0 && (
        <p className="rounded-xl border border-warning-400/30 bg-warning-400/10 px-4 py-3 text-sm text-warning-400">
          Nenhuma regra: o módulo ficará bloqueado para todos os alunos (exceto liberações manuais).
        </p>
      )}
      {rules.map((rule, index) => (
        <fieldset key={rule.key} className="surface-raised flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-semibold text-mist-100">Regra {index + 1}</legend>
            <button
              type="button"
              className="rounded p-1 text-mist-500 hover:text-danger-400"
              aria-label={`Remover regra ${index + 1}`}
              onClick={() => setRules((current) => current.filter((r) => r.key !== rule.key))}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <RuleFields
            rule={rule}
            allowCombined
            idPrefix={`rule-${index}`}
            onChange={(next) => setRules((current) => current.map((r) => (r.key === rule.key ? next : r)))}
          />
        </fieldset>
      ))}
      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="secondary" size="sm" disabled={rules.length >= 6} onClick={() => setRules((current) => [...current, newRule()])}>
          <Plus className="size-4" aria-hidden="true" /> Adicionar regra
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Salvar regras
        </Button>
      </div>
    </form>
  );
}
