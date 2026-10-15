"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Diálogo modal acessível baseado no elemento nativo <dialog> (foco, Esc e backdrop nativos). */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[min(100vw-2rem,44rem)] max-h-[min(100dvh-2rem,56rem)] overflow-hidden rounded-2xl border border-white/10 bg-ink-850 p-0 text-mist-100 shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-4">
            <div>
              <h2 id="dialog-title" className="text-lg font-semibold text-mist-50">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-mist-400">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-50"
              aria-label="Fechar"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="scrollbar-thin overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}
