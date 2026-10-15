import { CheckCircle2, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { LessonThumb } from "@/components/platform/lesson-thumb";
import { lessonStatus, type CourseSnapshot, type ModuleView } from "@/lib/access/snapshot";
import { cn } from "@/lib/cn";
import { formatDuration, moduleNumber } from "@/lib/format";

export type WatchProgress = {
  watchedSeconds: number;
  requiredSeconds: number;
  completed: boolean;
  minWatchPercent: number;
};

/** Lista de aulas do módulo (Server Component — pode receber Map do snapshot). */
export function PlaylistLessons({
  snapshot,
  module,
  currentLessonId,
}: {
  snapshot: CourseSnapshot;
  module: ModuleView;
  currentLessonId: string;
}) {
  return (
    <ol className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain p-2">
      {module.lessons.map((lesson, index) => {
        const status = lessonStatus(snapshot, module, lesson.id);
        const current = lesson.id === currentLessonId;
        const content = (
          <>
            <span className="w-5 shrink-0 pt-1 text-center text-xs font-semibold text-mist-500">{index + 1}</span>
            <LessonThumb
              thumbnailUrl={lesson.thumbnail_url}
              modulePosition={module.position}
              lessonPosition={lesson.position}
              locked={status === "locked"}
              showPlay={false}
              className="w-24 shrink-0 rounded-lg"
            />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={cn("line-clamp-2 text-sm leading-snug", current ? "font-semibold text-mist-50" : "text-mist-300")}>
                {lesson.title}
              </span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-mist-500">
                {formatDuration(lesson.duration_seconds)}
                {status === "completed" && (
                  <span className="flex items-center gap-1 text-brand-400">
                    <CheckCircle2 className="size-3.5" aria-hidden="true" /> Concluída
                  </span>
                )}
                {status === "in_progress" && !current && <span className="text-gold-400">Em andamento</span>}
                {current && (
                  <span className="flex items-center gap-1 text-brand-300">
                    <PlayCircle className="size-3.5" aria-hidden="true" /> Assistindo
                  </span>
                )}
                {status === "locked" && (
                  <span className="flex items-center gap-1">
                    <Lock className="size-3.5" aria-hidden="true" /> Bloqueada
                  </span>
                )}
              </span>
            </span>
          </>
        );
        return (
          <li key={lesson.id}>
            {status === "locked" ? (
              <div className="flex items-start gap-3 rounded-xl p-2.5 opacity-60">{content}</div>
            ) : (
              <Link
                href={`/plataforma/aula/${lesson.id}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex items-start gap-3 rounded-xl p-2.5 transition-colors",
                  current ? "bg-brand-500/[0.09] ring-1 ring-brand-500/30" : "hover:bg-white/[0.04]",
                )}
              >
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function playlistMeta(module: ModuleView) {
  return {
    moduleNumber: moduleNumber(module.position),
    completedRequired: module.progress.completedRequired,
    totalRequired: module.progress.totalRequired,
  };
}
