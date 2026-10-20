import { Bell, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/** CTA grande na landing no lugar dos módulos 02+ (lançamento v1). */
export function ComingSoonModulesCta() {
  return (
    <Reveal className="mt-8">
      <aside
        aria-labelledby="landing-em-breve-title"
        className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-linear-to-br from-ink-800 via-ink-850 to-ink-900 px-6 py-14 text-center sm:px-12 sm:py-16"
      >
        <div className="absolute -top-24 left-1/2 size-80 -translate-x-1/2 rounded-full bg-brand-500/12 blur-3xl" />
        <div className="absolute -right-16 -bottom-24 size-56 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4">
          <span className="grid size-14 place-items-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
            <Sparkles className="size-6" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-400 uppercase">Próximos módulos</p>
          <h3 id="landing-em-breve-title" className="text-3xl font-semibold text-mist-50 sm:text-4xl">
            Em breve
          </h3>
          <p className="text-base leading-relaxed text-mist-300">
            Novos módulos estão a caminho. Quando forem liberados, entraremos em contato para avisar você.
          </p>
          <p className="flex items-center gap-2 text-sm text-mist-500">
            <Bell className="size-4 text-brand-400" aria-hidden="true" />
            Aviso por e-mail quando estiverem disponíveis
          </p>
        </div>
      </aside>
    </Reveal>
  );
}
