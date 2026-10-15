import type { ReactNode } from "react";
import { Footer } from "@/components/landing/footer";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <ButtonLink href="/login" size="sm" variant="secondary">
            Acessar Plataforma
          </ButtonLink>
        </div>
      </header>
      <main id="conteudo" className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-8">
        {children}
      </main>
      <Footer />
    </>
  );
}

export function LegalArticle({ title, updatedAt, children }: { title: string; updatedAt: string; children: ReactNode }) {
  return (
    <article className="flex flex-col gap-5 text-sm leading-relaxed text-mist-300 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-mist-50 [&_li]:ml-5 [&_li]:list-disc">
      <header>
        <h1 className="text-3xl font-semibold text-mist-50">{title}</h1>
        <p className="mt-2 text-xs text-mist-500">Última atualização: {updatedAt}</p>
        <p className="mt-4 rounded-xl border border-warning-400/25 bg-warning-400/10 px-4 py-3 text-xs text-warning-400">
          Texto-base para validação jurídica da Bullex antes da publicação em produção.
        </p>
      </header>
      {children}
    </article>
  );
}
