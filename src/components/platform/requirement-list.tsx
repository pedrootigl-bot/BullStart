import { AlertTriangle, CheckCircle2, Clock3, Link2Off, Lock, WifiOff } from "lucide-react";
import type { RuleOutcome, RuleState } from "@/lib/access/engine";
import { cn } from "@/lib/cn";

const STATE_META: Record<RuleState, { label: string; icon: typeof Lock; className: string }> = {
  met: { label: "Requisito atendido", icon: CheckCircle2, className: "text-brand-400" },
  not_met: { label: "Requisito não atendido", icon: Lock, className: "text-mist-400" },
  pending: { label: "Aguardando confirmação", icon: Clock3, className: "text-warning-400" },
  unavailable: { label: "Dados temporariamente indisponíveis", icon: WifiOff, className: "text-warning-400" },
  unlinked: { label: "Conta sem vínculo verificado", icon: Link2Off, className: "text-danger-400" },
  invalid: { label: "Em configuração", icon: AlertTriangle, className: "text-mist-400" },
};

export function stateLabel(state: RuleState): string {
  return STATE_META[state].label;
}

function OutcomeItem({ outcome, nested = false }: { outcome: RuleOutcome; nested?: boolean }) {
  const meta = STATE_META[outcome.state];
  return (
    <li className={cn("flex gap-3", nested ? "py-2" : "py-3")}>
      <meta.icon className={cn("mt-0.5 size-5 shrink-0", meta.className)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-mist-50">
          {outcome.title}
          <span className="sr-only"> — {meta.label}</span>
        </p>
        <p className="mt-0.5 text-sm text-mist-400">{outcome.detail}</p>
        {outcome.children && outcome.children.length > 0 && (
          <ul className="mt-2 border-l border-white/10 pl-4">
            {outcome.children.map((child, index) => (
              <OutcomeItem key={`${child.type}-${index}`} outcome={child} nested />
            ))}
          </ul>
        )}
      </div>
      {!nested && (
        <span className={cn("hidden shrink-0 text-xs font-medium sm:block", meta.className)}>{meta.label}</span>
      )}
    </li>
  );
}

export function RequirementList({ outcomes }: { outcomes: RuleOutcome[] }) {
  return (
    <ul className="divide-y divide-white/[0.06]">
      {outcomes.map((outcome, index) => (
        <OutcomeItem key={`${outcome.type}-${index}`} outcome={outcome} />
      ))}
    </ul>
  );
}
