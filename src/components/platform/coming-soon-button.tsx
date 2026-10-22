"use client";

import { Lock } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/** Botão "Em Breve" com cardzinho de aviso ao clicar. */
export function ComingSoonButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full">
      <Button
        type="button"
        variant="secondary"
        size="md"
        aria-expanded={open}
        aria-controls={panelId}
        className={cn("w-full bg-black/30", className)}
        onClick={() => setOpen((value) => !value)}
      >
        <Lock className="size-3.5" aria-hidden="true" />
        Em Breve
      </Button>

      {open ? (
        <div
          id={panelId}
          role="status"
          className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] z-20 rounded-xl border border-white/12 bg-ink-850 px-3.5 py-3 text-center shadow-[0_12px_40px_-12px_rgb(0_0_0/0.8)] animate-rise"
        >
          <span
            aria-hidden="true"
            className="absolute top-full left-1/2 -mt-px size-2.5 -translate-x-1/2 rotate-45 border-r border-b border-white/12 bg-ink-850"
          />
          <p className="text-xs leading-relaxed text-mist-200">
            Quando estiver disponível, nossa equipe entrará em contato.
          </p>
        </div>
      ) : null}
    </div>
  );
}
