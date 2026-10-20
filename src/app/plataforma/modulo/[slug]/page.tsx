import { BookOpen, Clock, PlayCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComingSoonModules } from "@/components/platform/coming-soon-modules";
import { LessonCard, LockedModulePanel, ModuleHeader } from "@/components/platform/module-blocks";
import { ModuleQuizSection } from "@/components/platform/module-quiz-section";
import { RequirementList } from "@/components/platform/requirement-list";
import { ButtonLink } from "@/components/ui/button";
import { ModuleLockOverlay } from "@/components/ui/module-lock-overlay";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { getStudentContext } from "@/lib/access/student";
import { isLaunchVisibleModule } from "@/lib/catalog/launch";
import { formatDuration, moduleNumber } from "@/lib/format";
import { loadModuleQuiz } from "@/lib/quiz/service";

export const metadata: Metadata = { title: "Módulo" };

export default async function ModulePage({ params }: PageProps<"/plataforma/modulo/[slug]">) {
  const { slug } = await params;
  const { session, snapshot, depositConfigured } = await getStudentContext(`/plataforma/modulo/${slug}`);
  if (!snapshot) {
    return (
      <EmptyState icon={<BookOpen className="size-6" />} title="Formação indisponível" description="Os módulos ainda não foram publicados." />
    );
  }

  const current = snapshot.modules.find((m) => m.slug === slug);
  if (!current) notFound();

  if (!isLaunchVisibleModule(current.position)) {
    return (
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={[{ label: "Minha formação", href: "/plataforma" }, { label: "Em breve" }]} />
        <ComingSoonModules />
        <Link href="/plataforma" className="text-sm font-medium text-brand-400 hover:text-brand-300">
          ← Voltar para a formação
        </Link>
      </div>
    );
  }

  const quiz = await loadModuleQuiz(snapshot, session.profile.id, slug);
  const firstPending = current.lessons.find((l) => snapshot.progressByLesson.get(l.id)?.status !== "completed") ?? current.lessons[0];

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs
        items={[
          { label: "Minha formação", href: "/plataforma" },
          { label: `Módulo ${moduleNumber(current.position)}` },
        ]}
      />

      <div className="surface-raised p-6 sm:p-8">
        <ModuleHeader module={current} headingLevel="h1" />
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-mist-400">
          <span className="flex items-center gap-1.5">
            <PlayCircle className="size-4" aria-hidden="true" /> {current.lessons.length} aulas
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" /> {formatDuration(current.totalDurationSeconds)}
          </span>
          {current.topics.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Temas">
              {current.topics.map((topic) => (
                <li key={topic} className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-xs text-mist-300">
                  {topic}
                </li>
              ))}
            </ul>
          )}
        </div>
        {current.access.unlocked && firstPending && (
          <div className="mt-6">
            <ButtonLink href={`/plataforma/aula/${firstPending.id}`} className="w-full sm:w-auto">
              <PlayCircle className="size-5" aria-hidden="true" />
              {current.progress.completedRequired > 0 ? "Continuar módulo" : "Começar módulo"}
            </ButtonLink>
          </div>
        )}
      </div>

      <section id="requisitos" aria-labelledby="requisitos-title" className="scroll-mt-24">
        <h2 id="requisitos-title" className="mb-3 text-lg font-semibold text-mist-50">
          Requisitos de acesso
        </h2>
        {current.access.unlocked ? (
          <div className="surface px-5">
            <RequirementList outcomes={current.access.outcomes} />
            {current.access.via === "manual_grant" && (
              <p className="pb-4 text-sm text-sky-300">Este módulo foi liberado individualmente pela equipe Bullex Start.</p>
            )}
          </div>
        ) : (
          <LockedModulePanel module={current} depositConfigured={depositConfigured} />
        )}
      </section>

      <section aria-labelledby="aulas-title">
        <h2 id="aulas-title" className="mb-4 text-lg font-semibold text-mist-50">
          Aulas do módulo
        </h2>
        {current.lessons.length === 0 ? (
          <p className="surface p-5 text-sm text-mist-400">As aulas deste módulo serão publicadas em breve.</p>
        ) : current.access.unlocked ? (
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {current.lessons.map((lesson) => (
              <li key={lesson.id}>
                <LessonCard snapshot={snapshot} module={current} lesson={lesson} compactOnMobile />
              </li>
            ))}
          </ul>
        ) : (
          <div className="relative overflow-hidden rounded-2xl">
            <ul className="pointer-events-none grid select-none gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4" aria-hidden="true">
              {current.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <LessonCard snapshot={snapshot} module={current} lesson={lesson} compactOnMobile />
                </li>
              ))}
            </ul>
            <ModuleLockOverlay className="rounded-2xl" />
          </div>
        )}
      </section>

      {current.access.unlocked ? <ModuleQuizSection quiz={quiz} embedForm /> : null}

      <Link href="/plataforma" className="text-sm font-medium text-brand-400 hover:text-brand-300">
        ← Voltar para a formação
      </Link>
    </div>
  );
}
