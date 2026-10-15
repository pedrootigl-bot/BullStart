"use client";

import { ArrowRight, Lock } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const MESSAGE = "Continue operando para liberar os outros módulos";

/** Botão "Acessar" bloqueado: abre um cardzinho com a mensagem ao clicar. */
export function LockedModuleAccessButton({ moduleLabel }: { moduleLabel: string }) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => setOpen(false), 4200);

    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="flex w-full flex-col gap-2.5">
      <div
        id={tipId}
        role="status"
        aria-live="polite"
        className={cn(
          "overflow-hidden rounded-xl border border-white/12 bg-ink-900/95 shadow-xl transition-all duration-200",
          open ? "max-h-28 opacity-100" : "pointer-events-none max-h-0 border-transparent opacity-0",
        )}
      >
        <div className="flex items-start gap-2.5 px-3.5 py-3">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-ink-800 text-brand-300">
            <Lock className="size-3.5" aria-hidden="true" />
          </span>
          <p className="text-sm leading-snug text-mist-100">{MESSAGE}</p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("w-full", open && "border-brand-400/50 text-brand-300")}
        aria-expanded={open}
        aria-controls={tipId}
        aria-label={`Módulo ${moduleLabel} bloqueado. Toque para ver como liberar.`}
        onClick={() => setOpen((value) => !value)}
      >
        Acessar <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
