import { BadgeCheck, LineChart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/[0.06] bg-ink-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        <div className="absolute -bottom-40 -left-40 size-[520px] rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-md">
          <p className="eyebrow">Formação Trader Bullex</p>
          <p className="mt-4 text-3xl leading-tight font-semibold text-balance text-mist-50">
            Sua jornada para evoluir como trader começa aqui.
          </p>
          <ul className="mt-8 flex flex-col gap-4 text-sm text-mist-300">
            <li className="flex items-center gap-3">
              <LineChart className="size-5 text-brand-400" aria-hidden="true" /> Módulos do básico ao avançado
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-brand-400" aria-hidden="true" /> Progresso salvo com segurança
            </li>
            <li className="flex items-center gap-3">
              <BadgeCheck className="size-5 text-gold-400" aria-hidden="true" /> Certificado de conclusão verificável
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-mist-500">
          Conteúdo educacional. Não constitui recomendação de investimento e não garante resultados.
        </p>
      </aside>

      <main id="conteudo" className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold text-mist-50 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-mist-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-sm text-mist-400">{footer}</div>}
        </div>
        <nav aria-label="Links legais" className="flex justify-center gap-5 text-xs text-mist-500">
          <Link href="/" className="hover:text-mist-300">Início</Link>
          <Link href="/termos" className="hover:text-mist-300">Termos</Link>
          <Link href="/privacidade" className="hover:text-mist-300">Privacidade</Link>
        </nav>
      </main>
    </div>
  );
}

export function FormAlert({ tone, children }: { tone: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-danger-400/30 bg-danger-400/10 text-danger-400",
    success: "border-brand-500/30 bg-brand-500/10 text-brand-300",
    info: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  } as const;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}>
      {children}
    </div>
  );
}
