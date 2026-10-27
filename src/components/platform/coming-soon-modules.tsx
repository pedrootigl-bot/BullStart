import { Bell, Sparkles } from "lucide-react";

/** CTA de placeholder no lugar dos módulos ainda não lançados (v2). */
export function ComingSoonModules() {
  return (
    <section
      aria-labelledby="modulos-em-breve-title"
      className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-linear-to-br from-ink-800 via-ink-850 to-ink-900 px-6 py-14 text-center sm:px-10 sm:py-16"
    >
      <div className="grid-bg absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <div className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />
      <div className="absolute -right-20 -bottom-28 size-64 rounded-full bg-gold-400/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
        <span className="grid size-14 place-items-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
          <Sparkles className="size-6" aria-hidden="true" />
        </span>
        <p className="eyebrow">Próximos módulos</p>
        <h2 id="modulos-em-breve-title" className="text-3xl font-semibold tracking-tight text-mist-50 sm:text-4xl lg:text-5xl">
          Em breve
        </h2>
        <p className="text-base leading-relaxed text-mist-300 sm:text-lg">
          Estamos preparando os próximos módulos da formação. Assim que estiverem disponíveis, entraremos em contato
          com você.
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-mist-500">
          <Bell className="size-4 shrink-0 text-brand-400" aria-hidden="true" />
          Fique de olho no e-mail da sua conta Bull Academy
        </p>
      </div>
    </section>
  );
}
