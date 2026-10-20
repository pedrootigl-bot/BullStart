"use client";

import { ArrowRight, BookOpen, Check, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { buttonClasses } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

type WelcomeModalProps = {
  startHref: string;
};

function clearWelcomeParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("boas-vindas")) return;
  url.searchParams.delete("boas-vindas");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(null, "", next);
}

const emptySubscribe = () => () => undefined;

export function WelcomeModal({ startHref }: WelcomeModalProps) {
  const [open, setOpen] = useState(true);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    clearWelcomeParam();
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

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
            key="welcome-backdrop"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          <motion.div
            key="welcome-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 28, mass: 0.85 }}
            className="relative z-10 w-full max-w-[980px] overflow-hidden rounded-[28px] border border-brand-400/35 bg-ink-900 shadow-[0_40px_120px_-24px_rgba(0,0,0,0.9),0_0_80px_-20px_rgb(31_216_119/0.35)]"
          >
            <div className="grid md:grid-cols-[1.12fr_0.88fr]">
              <div className="relative min-h-[220px] overflow-hidden md:min-h-[520px]">
                <Image
                  src="/brand/welcome-bull.png"
                  alt="Touro Bullex Start"
                  fill
                  priority
                  quality={100}
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover object-[center_18%]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-ink-900 via-transparent to-transparent md:bg-linear-to-r md:from-transparent md:via-transparent md:to-ink-900/55" />
              </div>

              <div className="relative flex flex-col justify-center px-5 pt-5 pb-6 sm:px-8 sm:pt-7 sm:pb-8">
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
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

                <h2 id={titleId} className="mt-5 text-[1.85rem] leading-[1.1] font-semibold text-mist-50 sm:text-[2.15rem]">
                  Bem-vindo à
                  <br />
                  <span className="text-brand-400">Bullex Start</span>!
                </h2>

                <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-brand-400/30 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-300">
                  <Check className="size-3.5" aria-hidden="true" strokeWidth={2.5} />
                  Cadastro concluído
                </p>

                <p id={descId} className="mt-4 max-w-[28ch] text-sm leading-relaxed text-mist-300 sm:text-[15px]">
                  Sua conta foi criada com sucesso. Agora você já pode iniciar sua jornada e acessar os conteúdos da
                  plataforma.
                </p>

                <div className="mt-7 flex flex-col gap-3">
                  <Link
                    href={startHref}
                    className={cn(buttonClasses({ size: "lg" }), "w-full justify-between px-5")}
                    onClick={() => setOpen(false)}
                  >
                    Começar agora
                    <ArrowRight className="size-4.5" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    className={cn(
                      buttonClasses({ variant: "outline", size: "lg" }),
                      "w-full justify-between border-gold-400/50 px-5 text-mist-50 hover:border-gold-400/80 hover:text-gold-300",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <BookOpen className="size-4.5 text-gold-400" aria-hidden="true" />
                      Explorar plataforma
                    </span>
                    <ArrowRight className="size-4.5 opacity-70" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <p className="flex items-center justify-center gap-2 border-t border-white/[0.04] px-4 py-3 text-center text-[11px] tracking-wide text-mist-500">
              <span className="inline-flex h-3.5 w-3.5 items-end justify-between gap-px" aria-hidden="true">
                <span className="h-1.5 w-0.5 rounded-sm bg-gold-400/80" />
                <span className="h-2.5 w-0.5 rounded-sm bg-gold-400/80" />
                <span className="h-3.5 w-0.5 rounded-sm bg-gold-400/80" />
              </span>
              Conhecimento, estratégia e evolução para traders reais.
            </p>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
