"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { MenuToggleIcon, useMenuVariants } from "@/components/ui/menu-motion";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "#sobre", id: "sobre", label: "Sobre" },
  { href: "#formacao", id: "formacao", label: "Formação" },
  { href: "#certificado", id: "certificado", label: "Certificado" },
];

export function Navbar({ accessHref }: { accessHref: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const variants = useMenuVariants();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Em landscape (≥768px) o md já ativava o nav desktop sem espaço; fecha o drawer ao cruzar lg.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav aria-label="Principal" className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                aria-current={active === link.id ? "true" : undefined}
                className={cn(
                  "relative rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  active === link.id ? "text-mist-50" : "text-mist-300 hover:text-mist-50",
                )}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-4 -bottom-0.5 h-px bg-brand-400 transition-transform duration-300",
                    active === link.id ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <ButtonLink href={accessHref} size="sm" className="h-10 px-5">
            Acessar Plataforma
          </ButtonLink>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl text-mist-100 transition-colors hover:bg-white/5 lg:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <MenuToggleIcon open={open} />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            key="menu-mobile"
            initial="closed"
            animate="open"
            exit="closed"
            variants={variants.panel}
            className="h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-white/[0.06] bg-ink-950/95 px-5 pt-6 pb-10 lg:hidden"
          >
            <motion.ul variants={variants.list} className="flex flex-col gap-1">
              {LINKS.map((link) => (
                <motion.li key={link.href} variants={variants.item}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={active === link.id ? "true" : undefined}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-4 text-lg font-medium transition-colors hover:bg-white/5",
                      active === link.id ? "text-brand-300" : "text-mist-100",
                    )}
                  >
                    {link.label}
                    <span
                      aria-hidden="true"
                      className={cn("size-1.5 rounded-full bg-brand-400 transition-opacity", active === link.id ? "opacity-100" : "opacity-0")}
                    />
                  </a>
                </motion.li>
              ))}
              <motion.li variants={variants.item} className="pt-5">
                <ButtonLink href={accessHref} size="lg" className="w-full" onClick={() => setOpen(false)}>
                  Acessar Plataforma
                </ButtonLink>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
