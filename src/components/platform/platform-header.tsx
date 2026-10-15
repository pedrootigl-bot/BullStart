"use client";

import { Award, Home, LogOut, Shield, User } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { MenuToggleIcon, useMenuVariants } from "@/components/ui/menu-motion";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: typeof Home; exact?: boolean };

export function PlatformHeader({ name, email, isAdmin }: { name: string; email: string; isAdmin: boolean }) {
  const pathname = usePathname();
  // O menu móvel fica aberto apenas para a rota em que foi aberto; navegar o fecha.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (update: (value: boolean) => boolean) => setOpenedAt(update(open) ? pathname : null);
  const variants = useMenuVariants();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpenedAt(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const items: NavItem[] = [
    { href: "/plataforma", label: "Início", icon: Home, exact: true },
    { href: "/plataforma/certificado", label: "Certificado", icon: Award },
    { href: "/plataforma/perfil", label: "Perfil", icon: User },
    ...(isAdmin ? [{ href: "/admin", label: "Administração", icon: Shield }] : []),
  ];

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href || pathname.startsWith("/plataforma/modulo") || pathname.startsWith("/plataforma/aula")
      : pathname.startsWith(item.href);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo href="/plataforma" />

        <nav aria-label="Plataforma" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive(item) ? "bg-white/[0.06] text-mist-50" : "text-mist-400 hover:text-mist-50",
                  )}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right leading-tight">
            <p className="max-w-40 truncate text-sm font-medium text-mist-50">{name || "Aluno"}</p>
            <p className="max-w-40 truncate text-xs text-mist-500">{email}</p>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-300" aria-hidden="true">
            {initials || "BS"}
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="grid size-9 place-items-center rounded-lg text-mist-400 transition-colors hover:bg-white/5 hover:text-mist-50"
              aria-label="Sair da conta"
              title="Sair"
            >
              <LogOut className="size-4.5" />
            </button>
          </form>
        </div>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl text-mist-100 transition-colors hover:bg-white/5 md:hidden"
          aria-expanded={open}
          aria-controls="menu-plataforma"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <MenuToggleIcon open={open} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="menu-backdrop"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpenedAt(null)}
              className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] bg-ink-950/70 backdrop-blur-sm md:hidden"
            />
            <motion.div
              id="menu-plataforma"
              key="menu-plataforma"
              initial="closed"
              animate="open"
              exit="closed"
              variants={variants.panel}
              className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-y border-white/[0.06] bg-ink-950 px-4 pt-4 pb-5 shadow-2xl shadow-black/60 md:hidden"
            >
              <motion.ul variants={variants.list} className="flex flex-col gap-1">
                <motion.li variants={variants.item} className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-3">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-300"
                    aria-hidden="true"
                  >
                    {initials || "BS"}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-sm font-medium text-mist-50">{name || "Aluno"}</span>
                    <span className="block truncate text-xs text-mist-500">{email}</span>
                  </span>
                </motion.li>
                {items.map((item) => (
                  <motion.li key={item.href} variants={variants.item}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item) ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-base transition-colors",
                        isActive(item) ? "bg-brand-500/10 text-brand-300" : "text-mist-300 hover:bg-white/[0.04] hover:text-mist-50",
                      )}
                    >
                      <item.icon className="size-5" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
                <motion.li variants={variants.item} className="mt-2 border-t border-white/[0.06] pt-2">
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-base text-mist-300 transition-colors hover:bg-white/[0.04] hover:text-mist-50"
                    >
                      <LogOut className="size-5" aria-hidden="true" /> Sair
                    </button>
                  </form>
                </motion.li>
              </motion.ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
