import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Layers,
  Lock,
  Play,
  Sparkles,
  Trophy,
} from "lucide-react";
import { ComingSoonButton } from "@/components/platform/coming-soon-button";
import { ButtonLink } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { FORMATIONS, type FormationCatalogItem, type FormationTier } from "@/lib/catalog/formations";
import { cn } from "@/lib/cn";

const TIER_STYLES: Record<
  FormationTier,
  {
    card: string;
    body: string;
    panel: string;
    accent: string;
    levelBadge: string;
    button: "primary" | "secondary" | "gold";
    lockedButton: string;
  }
> = {
  trader: {
    card:
      "border-brand-400/55 shadow-[0_0_0_1px_rgb(47_212_41/0.22),0_0_36px_-6px_rgb(10_191_4/0.55)] hover:border-brand-300/80 hover:shadow-[0_0_0_1px_rgb(47_212_41/0.4),0_12px_40px_-10px_rgb(10_191_4/0.65),0_0_48px_-8px_rgb(10_191_4/0.45)]",
    body: "bg-[linear-gradient(180deg,rgb(8_28_18)_0%,rgb(6_14_10)_45%,rgb(5_10_8)_100%)]",
    panel: "border-brand-400/15 bg-black/35",
    accent: "text-brand-400",
    levelBadge: "bg-brand-500/20 text-brand-300 ring-brand-400/45",
    button: "primary",
    lockedButton: "",
  },
  silver: {
    card:
      "border-white/35 shadow-[0_0_0_1px_rgb(255_255_255/0.14),0_0_36px_-6px_rgb(210_220_230/0.35)] hover:border-white/55 hover:shadow-[0_0_0_1px_rgb(255_255_255/0.28),0_12px_40px_-10px_rgb(220_230_240/0.4),0_0_48px_-8px_rgb(255_255_255/0.2)]",
    body: "bg-[linear-gradient(180deg,rgb(22_24_26)_0%,rgb(12_13_14)_45%,rgb(8_9_10)_100%)]",
    panel: "border-white/10 bg-black/40",
    accent: "text-mist-200",
    levelBadge: "bg-white/12 text-mist-100 ring-white/25",
    button: "secondary",
    lockedButton: "border-white/20 text-mist-100 hover:border-white/35",
  },
  gold: {
    card:
      "border-gold-400/50 shadow-[0_0_0_1px_rgb(226_192_106/0.2),0_0_36px_-6px_rgb(201_162_74/0.5)] hover:border-gold-300/75 hover:shadow-[0_0_0_1px_rgb(226_192_106/0.4),0_12px_40px_-10px_rgb(201_162_74/0.55),0_0_48px_-8px_rgb(226_192_106/0.35)]",
    body: "bg-[linear-gradient(180deg,rgb(28_22_10)_0%,rgb(16_13_7)_45%,rgb(9_8_5)_100%)]",
    panel: "border-gold-400/15 bg-black/35",
    accent: "text-gold-300",
    levelBadge: "bg-gold-500/18 text-gold-300 ring-gold-400/40",
    button: "secondary",
    lockedButton: "border-gold-400/30 text-gold-200 hover:border-gold-400/50",
  },
};

function FormationCard({
  formation,
  unlocked,
  progress,
}: {
  formation: FormationCatalogItem;
  unlocked: boolean;
  progress: { completed: number; total: number; percent: number } | null;
}) {
  const style = TIER_STYLES[formation.id];

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform",
        "hover:-translate-y-1.5 motion-reduce:hover:translate-y-0",
        style.card,
        style.body,
      )}
    >
      {/* Imagem + badges + título sobre o fade */}
      <div className="relative aspect-[5/4] overflow-hidden sm:aspect-[4/3]">
        {/* Arte gerada pelo time BullStart; assets locais em /public/brand. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={formation.imageSrc}
          alt={formation.imageAlt}
          className="absolute inset-0 size-full object-cover object-[center_18%] transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
        />
        {/* Fade inferior: funde a imagem no tom do card */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-[72%] bg-linear-to-t to-transparent",
            formation.id === "trader" && "from-[rgb(8_28_18)] via-[rgb(8_28_18)/0.88]",
            formation.id === "silver" && "from-[rgb(22_24_26)] via-[rgb(22_24_26)/0.88]",
            formation.id === "gold" && "from-[rgb(28_22_10)] via-[rgb(28_22_10)/0.88]",
          )}
          aria-hidden="true"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase ring-1 ring-inset backdrop-blur-sm",
              style.levelBadge,
            )}
          >
            {formation.levelLabel}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ring-1 ring-inset backdrop-blur-sm",
              unlocked
                ? "bg-brand-500/20 text-brand-300 ring-brand-400/40"
                : "bg-black/45 text-mist-300 ring-white/15",
            )}
          >
            {unlocked ? (
              <>
                <span className="size-1.5 rounded-full bg-brand-400 shadow-[0_0_6px_rgb(47_212_41)]" aria-hidden="true" />
                Disponível
              </>
            ) : (
              <>
                <Lock className="size-3" aria-hidden="true" />
                Bloqueado
              </>
            )}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pt-10">
          <h2 className="text-xl font-semibold tracking-tight text-white drop-shadow-sm">{formation.title}</h2>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/70">{formation.description}</p>
        </div>
      </div>

      {/* Conteúdo sob a imagem, no tom do card */}
      <div className="relative flex flex-1 flex-col gap-3 px-3.5 pt-1 pb-3.5">
        <div className={cn(!unlocked && "blur-[2px]")} aria-hidden={!unlocked || undefined}>
          <ul className={cn("flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px]", style.accent)}>
            <li className="inline-flex items-center gap-1.5">
              <Layers className="size-3.5" aria-hidden="true" />
              <span>{formation.modulesLabel}</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" aria-hidden="true" />
              <span>{formation.hoursLabel}</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Award className="size-3.5" aria-hidden="true" />
              <span>Certificado</span>
            </li>
          </ul>

          {unlocked && progress ? (
            <div className={cn("mt-3 rounded-xl border px-3 py-2.5", style.panel)}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
                <span className="font-medium text-mist-100">Seu progresso</span>
                <span className="text-mist-400">
                  {progress.completed} de {progress.total} módulos · {progress.percent}%
                </span>
              </div>
              <ProgressBar value={progress.percent} label={`Progresso em ${formation.title}`} size="sm" />
            </div>
          ) : null}

          {!unlocked && formation.requirements.length > 0 ? (
            <div id={`requisitos-${formation.id}`} className={cn("mt-3 rounded-xl border px-3 py-2.5", style.panel)}>
              <p className="mb-2 text-[11px] font-medium text-mist-100/80">Requisitos para desbloquear:</p>
              <ul className="flex flex-col gap-1.5">
                {formation.requirements.map((requirement) => (
                  <li key={requirement} className="flex items-start gap-1.5 text-[11px] leading-snug text-mist-400">
                    <CheckCircle2 className={cn("mt-0.5 size-3 shrink-0", style.accent)} aria-hidden="true" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-auto pt-0.5">
          {unlocked && formation.href ? (
            <ButtonLink href={formation.href} variant={style.button} size="md" className="w-full">
              <Play className="size-4 fill-current" aria-hidden="true" />
              Acessar curso
            </ButtonLink>
          ) : (
            <ComingSoonButton className={style.lockedButton} />
          )}
        </div>
      </div>
    </article>
  );
}

export function FormationsCatalog({
  traderProgress,
}: {
  traderProgress: { completed: number; total: number; percent: number } | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:gap-10">
      <section
        aria-labelledby="formacoes-titulo"
        className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="max-w-lg">
          <p className="eyebrow">Catálogo de cursos</p>
          <h1 id="formacoes-titulo" className="mt-2 text-3xl font-semibold tracking-tight text-mist-50 sm:text-4xl">
            Formações BullStart
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-mist-400 sm:text-[0.95rem]">
            Escolha o próximo passo da sua jornada até se tornar um trader consistente.
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.07] bg-ink-850/80 p-3 sm:grid-cols-2 lg:w-[22rem]">
          {[
            { icon: BookOpen, label: "3 Formações" },
            { icon: Layers, label: "+60 Módulos" },
            { icon: Sparkles, label: "Do zero à performance" },
            { icon: Trophy, label: "Certificação em todas as etapas" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2 rounded-xl bg-black/25 px-2.5 py-2">
              <item.icon className="mt-0.5 size-3.5 shrink-0 text-brand-400" aria-hidden="true" />
              <dt className="text-[11px] font-medium leading-snug text-mist-200">{item.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Formações disponíveis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {FORMATIONS.map((formation) => {
          const unlocked = formation.id === "trader";
          return (
            <FormationCard
              key={formation.id}
              formation={formation}
              unlocked={unlocked}
              progress={unlocked ? traderProgress : null}
            />
          );
        })}
      </section>

      <section
        id="trilha"
        aria-labelledby="trilha-titulo"
        className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-ink-850/80 px-4 py-4 sm:px-5 sm:py-5"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 id="trilha-titulo" className="text-base font-semibold text-mist-50 sm:text-lg">
              Trilha de evolução
            </h2>
            <ol className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
              {FORMATIONS.map((formation, index) => (
                <li key={formation.id} className="flex items-center sm:flex-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "grid size-7 place-items-center rounded-full text-xs font-semibold",
                        formation.id === "trader"
                          ? "bg-brand-500 text-ink-950 shadow-[0_0_16px_rgb(10_191_4/0.4)]"
                          : formation.id === "silver"
                            ? "bg-white/12 text-mist-100 ring-1 ring-white/20"
                            : "bg-gold-500/20 text-gold-300 ring-1 ring-gold-400/30",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium text-mist-200 sm:text-sm">{formation.title}</span>
                  </div>
                  {index < FORMATIONS.length - 1 ? (
                    <span
                      className="mx-3 hidden h-px flex-1 bg-linear-to-r from-white/20 to-white/5 sm:block"
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <div className="shrink-0 rounded-xl border border-gold-400/20 bg-ink-950/50 px-4 py-3 sm:max-w-[15rem]">
            <p className="text-xs font-semibold text-gold-300">Conquiste todas as formações</p>
            <p className="mt-1 text-[11px] leading-relaxed text-mist-500">
              Certificado especial <span className="text-mist-300">Trader Completo</span>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
