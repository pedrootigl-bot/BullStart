"use client";

import { BookOpen, ClipboardList, LayoutDashboard, Layers, LogOut, PlayCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { signOutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/admin/modulos", label: "Módulos", icon: Layers },
  { href: "/admin/aulas", label: "Aulas", icon: PlayCircle },
  { href: "/admin/alunos", label: "Alunos", icon: Users },
  { href: "/admin/auditoria", label: "Auditoria", icon: ClipboardList },
] as const;

export function AdminNav({ name }: { name: string }) {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="border-b border-white/[0.06] bg-ink-950/90 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex h-16 items-center justify-between gap-2 px-4">
        <Logo href="/admin" className="min-w-0" />
        <span className="shrink-0 rounded-md bg-gold-400/10 px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-wide text-gold-300 uppercase">
          Admin
        </span>
      </div>
      <nav
        aria-label="Administração"
        className="scrollbar-none overflow-x-auto px-3 pb-3 [mask-image:linear-gradient(to_right,black_85%,transparent)] lg:flex-1 lg:overflow-visible lg:pb-0 lg:[mask-image:none]"
      >
        <ul className="flex gap-1 lg:flex-col">
          {ITEMS.map((item) => {
            const active = isActive(item.href, "exact" in item ? item.exact : false);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                    active ? "bg-brand-500/10 text-brand-300" : "text-mist-400 hover:bg-white/[0.04] hover:text-mist-50",
                  )}
                >
                  <item.icon className="size-4.5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="lg:mt-4 lg:border-t lg:border-white/[0.06] lg:pt-4">
            <Link
              href="/plataforma"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap text-mist-400 hover:bg-white/[0.04] hover:text-mist-50"
            >
              <BookOpen className="size-4.5" aria-hidden="true" /> Ver plataforma
            </Link>
          </li>
        </ul>
      </nav>
      <div className="hidden items-center justify-between gap-2 border-t border-white/[0.06] px-5 py-4 lg:flex">
        <p className="truncate text-sm text-mist-300">{name}</p>
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Sair da conta"
            title="Sair"
            className="grid size-9 place-items-center rounded-lg text-mist-400 hover:bg-white/5 hover:text-mist-50"
          >
            <LogOut className="size-4.5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
