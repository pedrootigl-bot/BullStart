"use client";

import { Award, GraduationCap, Home, LogOut, Shield, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { LogoCompact } from "@/components/ui/logo";
import { MenuToggleIcon } from "@/components/ui/menu-motion";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: typeof Home; exact?: boolean };

function buildNav(isAdmin: boolean): NavItem[] {
  return [
    { href: "/plataforma", label: "Início", icon: Home, exact: true },
    { href: "/plataforma/cursos", label: "Cursos", icon: GraduationCap },
    { href: "/plataforma/certificado", label: "Certificado", icon: Award },
    { href: "/plataforma/perfil", label: "Perfil", icon: User },
    ...(isAdmin ? [{ href: "/admin", label: "Administração", icon: Shield }] : []),
  ];
}

function isNavActive(pathname: string, item: NavItem) {
  if (item.href === "/plataforma/cursos") return pathname.startsWith("/plataforma/cursos");
  if (item.exact) {
    return (
      pathname === item.href ||
      pathname.startsWith("/plataforma/modulo") ||
      pathname.startsWith("/plataforma/aula") ||
      pathname.startsWith("/plataforma/prova")
    );
  }
  return pathname.startsWith(item.href);
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function SidebarNav({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Menu principal" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isNavActive(pathname, item);
        return (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[0.92rem] font-medium no-underline transition-all duration-300",
              active
                ? "platform-nav-active border border-brand-500/60 font-bold text-white"
                : "border border-transparent text-mist-400 hover:bg-brand-500/10 hover:text-mist-50 active:scale-[0.985]",
            )}
          >
            <item.icon
              className={cn(
                "size-[18px] transition-all duration-300",
                active ? "text-brand-500" : "text-current group-hover:translate-x-0.5 group-hover:text-brand-500",
              )}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PlatformShell({
  name,
  email,
  isAdmin,
  children,
}: {
  name: string;
  email: string;
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const items = buildNav(isAdmin);
  const initials = initialsOf(name) || "BS";
  const menuId = useId();
  const profileId = useId();
  // Menu móvel fica aberto só na rota em que foi aberto; navegar fecha.
  const [mobileAt, setMobileAt] = useState<string | null>(null);
  const [profileAt, setProfileAt] = useState<string | null>(null);
  const mobileOpen = mobileAt === pathname;
  const profileOpen = profileAt === pathname;
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setMobileAt(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setMobileAt(null);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileAt(null);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setProfileAt(null);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950 text-white">
      <header className="platform-topbar relative z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-brand-500/14 px-5 backdrop-blur-[10px]">
        <LogoCompact href="/plataforma" />

        <div className="flex items-center gap-2.5">
          <div ref={profileRef} className="relative hidden lg:block">
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-2.5 rounded-full border border-transparent py-[3.5px] pr-2 pl-[3.5px] transition-all duration-200",
                profileOpen
                  ? "border-brand-500/14 bg-brand-500/10"
                  : "hover:border-brand-500/14 hover:bg-brand-500/10",
              )}
              aria-label="Menu do perfil"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-controls={profileId}
              onClick={() => setProfileAt(profileOpen ? null : pathname)}
            >
              <span
                className="grid size-8 place-items-center rounded-full border border-brand-500/28 bg-ink-850 text-xs font-semibold text-brand-300 shadow-[0_0_0_2px_rgb(212_176_106/0.12)]"
                aria-hidden="true"
              >
                {initials}
              </span>
              <span className="flex flex-col items-start gap-px text-left leading-none">
                <strong className="text-[0.84rem] font-semibold text-white">{name || "Aluno"}</strong>
                <span className="max-w-36 truncate text-[0.68rem] text-mist-400">{email}</span>
              </span>
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={cn(
                  "text-brand-500/55 transition-transform duration-200",
                  profileOpen && "rotate-180 text-brand-500",
                )}
                aria-hidden="true"
              >
                <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <AnimatePresence>
              {profileOpen ? (
                <motion.div
                  id={profileId}
                  role="menu"
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="platform-dropdown absolute top-[calc(100%+0.5rem)] right-0 z-40 min-w-56 origin-top-right rounded-lg border border-brand-500/14 p-1.5 shadow-[0_14px_32px_rgb(0_0_0/0.45)]"
                >
                  <Link
                    href="/plataforma/perfil"
                    role="menuitem"
                    className="flex w-full items-center rounded-[9px] px-3.5 py-2.5 text-[0.88rem] font-medium text-mist-100 transition-colors hover:bg-brand-500/10 hover:text-white"
                    onClick={() => setProfileAt(null)}
                  >
                    Meu perfil
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      role="menuitem"
                      className="flex w-full items-center rounded-[9px] px-3.5 py-2.5 text-[0.88rem] font-bold tracking-wide text-brand-500 transition-colors hover:bg-brand-500/10"
                      onClick={() => setProfileAt(null)}
                    >
                      Administração
                    </Link>
                  ) : null}
                  <div className="mx-1.5 my-1 h-px bg-brand-500/12" />
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-[9px] px-3.5 py-2.5 text-left text-[0.88rem] font-medium text-danger-400 transition-colors hover:bg-danger-400/10"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Sair
                    </button>
                  </form>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl text-mist-100 transition-colors hover:bg-white/5 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileAt(mobileOpen ? null : pathname)}
          >
            <MenuToggleIcon open={mobileOpen} />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="platform-sidebar-rail relative isolate hidden min-h-[calc(100dvh-4rem)] flex-col self-stretch overflow-hidden border-r border-brand-500/14 lg:flex">
          <aside className="relative z-1 sticky top-0 flex w-full flex-col gap-3.5 px-2.5 pt-4 pb-3.5">
            <SidebarNav items={items} pathname={pathname} />
          </aside>
        </div>

        <div className="flex min-w-0 flex-col">
          <main
            id="conteudo"
            className="relative z-2 flex min-h-[calc(100dvh-4rem)] min-w-0 flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:px-10 lg:py-6"
          >
            {children}
          </main>
          <footer className="border-t border-white/[0.06] px-4 py-5 text-center text-xs leading-relaxed text-mist-500 sm:px-6 lg:px-10">
            Conteúdo educacional. Não constitui recomendação personalizada de investimento e não garante resultados.
          </footer>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              key="shell-backdrop"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileAt(null)}
              className="fixed inset-0 top-16 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              id={menuId}
              key="shell-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-16 right-0 z-50 flex w-[min(18rem,88vw)] flex-col gap-3 overflow-y-auto border-l border-brand-500/14 bg-ink-950 px-3 pt-4 pb-5 shadow-2xl shadow-black/60 lg:hidden"
            >
              <div className="mb-1 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-3">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-brand-500/28 bg-brand-500/15 text-sm font-semibold text-brand-300"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-medium text-mist-50">{name || "Aluno"}</span>
                  <span className="block truncate text-xs text-mist-500">{email}</span>
                </span>
              </div>
              <SidebarNav items={items} pathname={pathname} onNavigate={() => setMobileAt(null)} />
              <form action={signOutAction} className="mt-2 border-t border-white/[0.06] pt-2">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base text-mist-300 transition-colors hover:bg-white/[0.04] hover:text-mist-50"
                >
                  <LogOut className="size-5" aria-hidden="true" /> Sair
                </button>
              </form>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
