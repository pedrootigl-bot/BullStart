import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "gold" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-white/5 text-mist-300 border-white/10",
  brand: "bg-brand-500/10 text-brand-300 border-brand-500/25",
  gold: "bg-gold-400/10 text-gold-300 border-gold-400/25",
  warning: "bg-warning-400/10 text-warning-400 border-warning-400/25",
  danger: "bg-danger-400/10 text-danger-400 border-danger-400/25",
  info: "bg-sky-400/10 text-sky-300 border-sky-400/25",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
