"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MobileBottomNav } from "@/components/landing/mobile-bottom-nav";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "#sobre", id: "sobre", label: "Sobre" },
  { href: "#formacao", id: "formacao", label: "Formação" },
  { href: "#certificado", id: "certificado", label: "Certificado" },
];

export function Navbar({ accessHref }: { accessHref: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = LINKS.map((link) => document.getElementById(link.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0.2, 0.45, 0.7] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Principal"
          className="relative mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:gap-8 sm:px-8"
        >
          <Link
            href="/"
            className="group relative z-10 min-w-0 shrink text-inherit no-underline"
            aria-label="Bull Academy — início"
          >
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[1.35rem] font-semibold tracking-[-0.02em] text-mist-50 transition-colors duration-300 group-hover:text-white sm:text-[1.5rem]">
                Bull <span className="text-brand-400">Academy</span>
              </span>
              <span className="mt-1.5 text-[0.625rem] font-medium tracking-[0.22em] text-mist-500 uppercase transition-colors duration-300 group-hover:text-mist-400 sm:text-[0.6875rem]">
                Formação de Traders
              </span>
            </span>
          </Link>

          <ul className="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 items-center justify-center gap-0.5 lg:flex">
            {LINKS.map((link) => (
              <li key={link.href} className="pointer-events-auto">
                <a
                  href={link.href}
                  aria-current={active === link.id ? "true" : undefined}
                  className={cn(
                    "relative rounded-lg px-3.5 py-2 text-[0.8125rem] font-medium tracking-[0.02em] transition-colors",
                    active === link.id ? "text-mist-50" : "text-mist-400 hover:text-mist-50",
                  )}
                >
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-3.5 -bottom-0.5 h-px origin-center bg-brand-400 transition-transform duration-300",
                      active === link.id ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </a>
              </li>
            ))}
          </ul>

          <ButtonLink
            href={accessHref}
            size="sm"
            className="relative z-10 h-9 shrink-0 px-3.5 text-[0.75rem] tracking-[0.01em] sm:h-10 sm:px-5 sm:text-[0.8125rem]"
          >
            Acessar Plataforma
          </ButtonLink>
        </nav>
      </header>

      <MobileBottomNav activeSection={active} />
    </>
  );
}
