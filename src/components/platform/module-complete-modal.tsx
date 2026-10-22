"use client";

import { ArrowRight, PartyPopper, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { buttonClasses } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { markModuleCelebrated } from "@/lib/catalog/module-celebration";
import { cn } from "@/lib/cn";

type ModuleCompleteModalProps = {
  moduleId: string;
  moduleTitle: string;
  continueHref?: string;
  onClose?: () => void;
};

const emptySubscribe = () => () => undefined;

/** Modal de parabenização ao concluir 100% do módulo (aulas + prova). */
export function ModuleCompleteModal({
  moduleId,
  moduleTitle,
  continueHref = "/plataforma",
  onClose,
}: ModuleCompleteModalProps) {
  const [open, setOpen] = useState(true);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    markModuleCelebrated(moduleId);
  }, [moduleId]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  function close() {
    setOpen(false);
    onClose?.();
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence
      onExitComplete={() => {
        document.body.style.overflow = "";
      }}
    >
      {open ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6" role="presentation">
          <motion.div
            key="module-complete-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
            onClick={close}
          />

          <motion.div
            key="module-complete-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.85 }}
            className="relative z-10 w-full max-w-[920px] overflow-hidden rounded-[28px] border border-brand-400/35 bg-ink-900 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.9),0_0_80px_-20px_rgb(10_191_4/0.35)]"
          >
            <div className="grid md:grid-cols-[minmax(0,22rem)_1fr] md:items-stretch">
              <div className="relative aspect-[4/3] overflow-hidden bg-ink-950 md:aspect-auto">
                <Image
                  src="/brand/module-complete-panel.jpg"
                  alt=""
                  fill
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 352px"
                  className="object-cover object-[center_center]"
                />
              </div>

              <div className="relative flex flex-col justify-center px-5 pt-5 pb-6 sm:px-8 sm:pt-7 sm:pb-8">
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-50"
                  aria-label="Fechar"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>

                <div className="flex items-center gap-2.5 pr-10">
                  <LogoMark className="size-8" />
                  <p className="text-[13px] font-bold tracking-[0.16em] text-mist-50">
                    BULLEX <span className="text-brand-400">START</span>
                  </p>
                </div>

                <h2 id={titleId} className="mt-5 text-[1.75rem] leading-[1.12] font-semibold text-mist-50 sm:text-[2.05rem]">
                  Parabéns!
                  <br />
                  <span className="text-brand-400">Módulo concluído</span>
                </h2>

                <p className="mt-4 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-300">
                  <PartyPopper className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{moduleTitle}</span>
                </p>

                <p id={descId} className="mt-4 max-w-[34ch] text-sm leading-relaxed text-mist-300 sm:text-[15px]">
                  Você concluiu todas as aulas e foi aprovado na prova deste módulo. Continue sua evolução na trilha
                  BullStart.
                </p>

                <div className="mt-7 flex flex-col gap-3">
                  <Link
                    href={continueHref}
                    className={cn(buttonClasses({ size: "lg" }), "w-full justify-between px-5")}
                    onClick={close}
                  >
                    Continuar formação
                    <ArrowRight className="size-4.5" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    className={cn(buttonClasses({ variant: "outline", size: "lg" }), "w-full")}
                    onClick={close}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
