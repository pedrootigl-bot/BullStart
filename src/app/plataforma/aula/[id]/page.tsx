import { BookOpen, FileText, Target } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComingSoonModules } from "@/components/platform/coming-soon-modules";
import { LockedModulePanel } from "@/components/platform/module-blocks";
import { LessonStage } from "@/components/player/lesson-stage";
import { PlaylistLessons, playlistMeta } from "@/components/player/playlist";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { requiredWatchSeconds } from "@/lib/access/lesson-guard";
import { findLesson } from "@/lib/access/snapshot";
import { getStudentContext } from "@/lib/access/student";
import { isLaunchVisibleModule } from "@/lib/catalog/launch";
import { formatDuration, moduleNumber } from "@/lib/format";
import { resolvePlayback } from "@/lib/video/playback";

export const metadata: Metadata = { title: "Aula" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LessonPage({ params }: PageProps<"/plataforma/aula/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { snapshot, depositConfigured } = await getStudentContext(`/plataforma/aula/${id}`);
  if (!snapshot) {
    return <EmptyState icon={<BookOpen className="size-6" />} title="Formação indisponível" description="Os módulos ainda não foram publicados." />;
  }

  const entry = findLesson(snapshot, id);
  if (!entry) notFound();
  const { module, lesson, previous } = entry;

  if (!isLaunchVisibleModule(module.position)) {
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

  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: "Minha formação", href: "/plataforma" },
        { label: `Módulo ${moduleNumber(module.position)}`, href: `/plataforma/modulo/${module.slug}` },
        { label: lesson.title },
      ]}
    />
  );

  // Autorização server-side: sem módulo liberado não há URL de vídeo nem metadados privados.
  if (!module.access.unlocked) {
    return (
      <div className="flex flex-col gap-6">
        {breadcrumbs}
        <h1 className="text-2xl font-semibold text-mist-50">{module.title}</h1>
        <LockedModulePanel module={module} depositConfigured={depositConfigured} />
      </div>
    );
  }

  let next = entry.next ? { href: `/plataforma/aula/${entry.next.id}`, title: entry.next.title } : null;
  if (!next) {
    const nextModule = snapshot.modules.find(
      (m) =>
        isLaunchVisibleModule(m.position) &&
        m.position > module.position &&
        m.access.unlocked &&
        m.lessons.length > 0,
    );
    if (nextModule) next = { href: `/plataforma/aula/${nextModule.lessons[0]!.id}`, title: nextModule.lessons[0]!.title };
  }

  const playback = await resolvePlayback(lesson.id);
  const progress = snapshot.progressByLesson.get(lesson.id);
  const ratio = Number(snapshot.course.completion_min_watch_ratio);
  const meta = playlistMeta(module);

  return (
    <div className="flex flex-col gap-6">
      {breadcrumbs}

      <LessonStage
        key={lesson.id}
        workspace={{
          lessonId: lesson.id,
          title: lesson.title,
          initialSrc: playback.ok ? playback.url : null,
          durationSeconds: lesson.duration_seconds,
          initialPosition: progress?.status === "completed" ? 0 : (progress?.last_position_seconds ?? 0),
          initialWatched: progress?.watched_seconds ?? 0,
          requiredSeconds: requiredWatchSeconds(lesson.duration_seconds, ratio),
          initiallyCompleted: progress?.status === "completed",
          previous: previous ? { href: `/plataforma/aula/${previous.id}`, title: previous.title } : null,
          next,
          minWatchPercent: Math.round(ratio * 100),
        }}
        moduleNumberLabel={meta.moduleNumber}
        completedRequired={meta.completedRequired}
        totalRequired={meta.totalRequired}
        playlistLessons={<PlaylistLessons snapshot={snapshot} module={module} currentLessonId={lesson.id} />}
        belowPlayer={
          <article aria-labelledby="aula-titulo" className="flex flex-col gap-6">
            <header>
              <p className="text-xs font-semibold tracking-[0.18em] text-brand-400">
                MÓDULO {moduleNumber(module.position)} · AULA {moduleNumber(lesson.position)}
              </p>
              <h1 id="aula-titulo" className="mt-2 text-2xl font-semibold text-balance text-mist-50 sm:text-3xl">
                {lesson.title}
              </h1>
              <p className="mt-1 text-sm text-mist-500">{formatDuration(lesson.duration_seconds)}</p>
            </header>

            <section className="surface p-5 sm:p-6" aria-labelledby="sobre-aula">
              <h2 id="sobre-aula" className="text-lg font-semibold text-mist-50">
                Sobre esta aula
              </h2>
              {lesson.description && <p className="mt-2 leading-relaxed whitespace-pre-line text-mist-300">{lesson.description}</p>}

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {lesson.objectives.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-mist-100">
                      <Target className="size-4 text-brand-400" aria-hidden="true" /> Objetivos de aprendizado
                    </h3>
                    <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm text-mist-300 marker:text-brand-500">
                      {lesson.objectives.map((objective) => (
                        <li key={objective}>{objective}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {lesson.topics.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-mist-100">
                      <BookOpen className="size-4 text-brand-400" aria-hidden="true" /> Conteúdos abordados
                    </h3>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {lesson.topics.map((topic) => (
                        <li key={topic} className="rounded-full bg-white/[0.05] px-2.5 py-1 text-xs text-mist-300">
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {lesson.materials.length > 0 && (
                <div className="mt-6 border-t border-white/[0.06] pt-5">
                  <h3 className="text-sm font-semibold text-mist-100">Materiais complementares</h3>
                  <ul className="mt-2 flex flex-col gap-2">
                    {lesson.materials.map((material) => (
                      <li key={material.url}>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300"
                        >
                          <FileText className="size-4" aria-hidden="true" /> {material.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </article>
        }
      />
    </div>
  );
}
