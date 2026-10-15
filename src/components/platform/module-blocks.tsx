import { ArrowRight, Clock, ExternalLink, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { LessonThumb } from "@/components/platform/lesson-thumb";
import { RequirementList } from "@/components/platform/requirement-list";
import { LessonStatusBadge } from "@/components/platform/status";
import { VerifyRequirementsButton } from "@/components/platform/verify-requirements-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ModuleLockOverlay } from "@/components/ui/module-lock-overlay";
import { ProgressBar } from "@/components/ui/progress";
import { SnapCarousel } from "@/components/ui/snap-carousel";
import { lessonStatus, type CourseSnapshot, type LessonView, type ModuleView } from "@/lib/access/snapshot";
import { cn } from "@/lib/cn";
import { formatDuration, moduleNumber } from "@/lib/format";

export function LessonCard({
  snapshot,
  module,
  lesson,
  compactOnMobile = false,
}: {
  snapshot: CourseSnapshot;
  module: ModuleView;
  lesson: LessonView;
  /** Abaixo de `sm`, vira uma linha (miniatura à esquerda) para listas longas. */
  compactOnMobile?: boolean;
}) {
  const status = lessonStatus(snapshot, module, lesson.id);
  const progress = snapshot.progressByLesson.get(lesson.id);
  const watchedPercent =
    progress && lesson.duration_seconds > 0 ? Math.min(100, (progress.last_position_seconds / lesson.duration_seconds) * 100) : 0;
  const locked = status === "locked";

  const body = (
    <>
      <div className={cn("relative", compactOnMobile && "w-32 shrink-0 self-center sm:w-auto sm:self-auto")}>
        <LessonThumb
          thumbnailUrl={lesson.thumbnail_url}
          modulePosition={module.position}
          lessonPosition={lesson.position}
          locked={locked}
          compactOnMobile={compactOnMobile}
          className={cn(compactOnMobile && "max-sm:rounded-lg")}
        />
        {status === "in_progress" && (
          <ProgressBar value={watchedPercent} label="Posição na aula" size="sm" tone="gold" className="absolute inset-x-0 bottom-0 rounded-none" />
        )}
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col gap-2 p-4", compactOnMobile && "max-sm:gap-1 max-sm:p-0 max-sm:py-0.5")}>
        <p className="text-xs font-medium tracking-wide text-mist-500">AULA {moduleNumber(lesson.position)}</p>
        <h3 className="line-clamp-2 text-[15px] leading-snug font-medium text-mist-50">{lesson.title}</h3>
        <div className={cn("mt-auto flex items-center justify-between gap-2 pt-2", compactOnMobile && "max-sm:flex-wrap max-sm:pt-1")}>
          <span className="flex items-center gap-1.5 text-xs text-mist-400">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatDuration(lesson.duration_seconds)}
          </span>
          <LessonStatusBadge status={status} />
        </div>
      </div>
    </>
  );

  const layout = cn("surface flex h-full flex-col overflow-hidden", compactOnMobile && "max-sm:flex-row max-sm:gap-3 max-sm:p-2.5");

  if (locked) {
    return (
      <div className={cn(layout, "opacity-70")} aria-label={`${lesson.title} — bloqueada`}>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/plataforma/aula/${lesson.id}`}
      className={cn(layout, "group transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-500/30")}
    >
      {body}
    </Link>
  );
}

export function LockedModulePanel({ module, depositConfigured }: { module: ModuleView; depositConfigured: boolean }) {
  const { access } = module;
  return (
    <div className="surface relative overflow-hidden p-5 sm:p-6">
      <div className="absolute -top-20 -right-20 size-56 rounded-full bg-white/[0.02] blur-2xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
        <div className="flex items-start gap-4 lg:w-[38%]">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-ink-800 text-mist-300">
            <Lock className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-mist-50">Este módulo ainda não está disponível.</p>
            <p className="mt-1 text-sm text-mist-400">
              Confira abaixo os requisitos de acesso vinculados à sua conta Bullex. Assim que forem atendidos, as aulas
              são liberadas automaticamente.
            </p>
            <p className="mt-2 text-xs text-mist-500">
              {module.lessons.length} aulas · {formatDuration(module.totalDurationSeconds)}
            </p>
          </div>
        </div>

        <div className="flex-1">
          <RequirementList outcomes={access.outcomes} />
          <div className="mt-4 flex flex-wrap gap-3">
            {access.canRefreshEligibility ? (
              <VerifyRequirementsButton moduleId={module.id} />
            ) : (
              <ButtonLink href={`/plataforma/modulo/${module.slug}#requisitos`} variant="outline" size="sm">
                Verificar requisitos
              </ButtonLink>
            )}
            {access.showDepositCta && depositConfigured && (
              <a href="/api/broker/deposit" className={buttonClasses({ variant: "gold", size: "sm" })} rel="noopener">
                Acessar área de depósito <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            )}
          </div>
          {access.showDepositCta && (
            <p className="mt-3 text-xs leading-relaxed text-mist-500">
              {depositConfigured
                ? "Você será direcionado ao ambiente oficial da Bullex. "
                : "A área de depósito oficial ainda não está disponível nesta plataforma. "}
              Depósitos e operações financeiras envolvem riscos e não garantem resultados.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModuleHeader({ module, headingLevel = "h2" }: { module: ModuleView; headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  const { progress, access } = module;
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-[0.18em] text-brand-400">MÓDULO {moduleNumber(module.position)}</span>
          {!access.unlocked && (
            <Badge tone="neutral">
              <Lock className="size-3" aria-hidden="true" /> Bloqueado
            </Badge>
          )}
          {access.unlocked && access.via === "manual_grant" && <Badge tone="info">Liberação manual</Badge>}
          {access.unlocked && progress.percent === 100 && <Badge tone="brand">Concluído</Badge>}
        </div>
        <Heading className="mt-2 text-xl font-semibold text-mist-50 sm:text-2xl">{module.title}</Heading>
        <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{module.description}</p>
      </div>
      {access.unlocked && (
        <div className="w-full shrink-0 lg:w-64">
          <div className="mb-2 flex items-center justify-between text-xs text-mist-400">
            <span>
              {progress.completedRequired}/{progress.totalRequired} aulas
            </span>
            <span className="font-medium text-mist-100">{progress.percent}%</span>
          </div>
          <ProgressBar value={progress.percent} label={`Progresso do módulo ${moduleNumber(module.position)}`} />
        </div>
      )}
    </div>
  );
}

export function ModuleSection({
  snapshot,
  module,
  depositConfigured,
}: {
  snapshot: CourseSnapshot;
  module: ModuleView;
  depositConfigured: boolean;
}) {
  return (
    <section aria-labelledby={`modulo-${module.id}`} className="flex flex-col gap-5">
      <div id={`modulo-${module.id}`} className="flex flex-col gap-1">
        <ModuleHeader module={module} />
        <Link
          href={`/plataforma/modulo/${module.slug}`}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
        >
          Ver detalhes do módulo <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
      {module.access.unlocked ? (
        module.lessons.length > 0 ? (
          <SnapCarousel itemLabel="a aula" gutter="platform" gridClassName="sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {module.lessons.map((lesson) => (
              <li key={lesson.id}>
                <LessonCard snapshot={snapshot} module={module} lesson={lesson} />
              </li>
            ))}
          </SnapCarousel>
        ) : (
          <p className="surface flex items-center gap-2 p-5 text-sm text-mist-400">
            <PlayCircle className="size-4" aria-hidden="true" /> As aulas deste módulo serão publicadas em breve.
          </p>
        )
      ) : (
        <>
          {module.lessons.length > 0 && (
            <div className="relative overflow-hidden rounded-2xl">
              <div className="pointer-events-none select-none" aria-hidden="true">
                <SnapCarousel itemLabel="a aula" gutter="platform" gridClassName="sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <LessonCard snapshot={snapshot} module={module} lesson={lesson} />
                    </li>
                  ))}
                </SnapCarousel>
              </div>
              <ModuleLockOverlay className="rounded-2xl" />
            </div>
          )}
          <LockedModulePanel module={module} depositConfigured={depositConfigured} />
        </>
      )}
    </section>
  );
}
