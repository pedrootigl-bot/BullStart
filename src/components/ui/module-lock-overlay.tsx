import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";

/** Overlay visual de módulo bloqueado (landing e plataforma). */
export function ModuleLockOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink-950/50 px-5 text-center backdrop-blur-lg",
        className,
      )}
      aria-hidden="true"
    >
      <span className="flex size-14 items-center justify-center rounded-full border border-white/15 bg-ink-950/75 text-mist-100 shadow-lg">
        <Lock className="size-6" strokeWidth={1.75} />
      </span>
      <p className="max-w-[16rem] text-sm leading-snug font-medium text-mist-100/90">
        Opere para liberar os outros módulos
      </p>
    </div>
  );
}
