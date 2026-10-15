"use client";

import { useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/cn";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN = [0.4, 0, 1, 1] as const;

/** Variantes compartilhadas dos menus móveis: painel em cortina e itens em cascata. */
export function useMenuVariants(): { panel: Variants; list: Variants; item: Variants } {
  const reduce = useReducedMotion();

  if (reduce) {
    const fade: Variants = { closed: { opacity: 0 }, open: { opacity: 1 } };
    return { panel: fade, list: {}, item: {} };
  }

  return {
    panel: {
      closed: { opacity: 0, clipPath: "inset(0% 0% 100% 0%)", transition: { duration: 0.25, ease: EASE_IN } },
      open: { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.4, ease: EASE_OUT } },
    },
    list: {
      closed: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
      open: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
    },
    item: {
      closed: { opacity: 0, y: -10, transition: { duration: 0.15, ease: EASE_IN } },
      open: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
    },
  };
}

/** Ícone hambúrguer que se transforma em "X". */
export function MenuToggleIcon({ open }: { open: boolean }) {
  const line = "absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";
  return (
    <span className="relative block h-3.5 w-5" aria-hidden="true">
      <span className={cn(line, "top-0", open && "translate-y-1.5 rotate-45")} />
      <span className={cn(line, "top-1.5", open && "scale-x-0 opacity-0")} />
      <span className={cn(line, "top-3", open && "-translate-y-1.5 -rotate-45")} />
    </span>
  );
}
