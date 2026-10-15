"use client";

import { CheckCircle2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { LessonWorkspace } from "@/components/player/lesson-workspace";
import type { WatchProgress } from "@/components/player/playlist";
import { ProgressBar } from "@/components/ui/progress";
import { formatClock } from "@/lib/format";

type WorkspaceProps = {
  lessonId: string;
  title: string;
  initialSrc: string | null;
  durationSeconds: number;
  initialPosition: number;
  initialWatched: number;
  requiredSeconds: number;
  initiallyCompleted: boolean;
  previous: { href: string; title: string } | null;
  next: { href: string; title: string } | null;
  minWatchPercent: number;
};

export function LessonStage({
  workspace,
  moduleNumberLabel,
  completedRequired,
  totalRequired,
  playlistLessons,
  belowPlayer,
}: {
  workspace: WorkspaceProps;
  moduleNumberLabel: string;
  completedRequired: number;
  totalRequired: number;
  /** Lista de aulas renderizada no servidor (evita serializar Map do snapshot). */
  playlistLessons: ReactNode;
  belowPlayer?: ReactNode;
}) {
  const [watch, setWatch] = useState<WatchProgress>({
    watchedSeconds: workspace.initialWatched,
    requiredSeconds: workspace.requiredSeconds,
    completed: workspace.initiallyCompleted,
    minWatchPercent: workspace.minWatchPercent,
  });

  const canComplete = watch.completed || watch.watchedSeconds >= watch.requiredSeconds;
  const remaining = Math.max(0, watch.requiredSeconds - watch.watchedSeconds);
  const watchedPercent =
    watch.requiredSeconds > 0 ? Math.min(100, (watch.watchedSeconds / watch.requiredSeconds) * 100) : 100;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-8">
      <div className="flex min-w-0 flex-col gap-8">
        <LessonWorkspace
          key={workspace.lessonId}
          {...workspace}
          showWatchProgress={false}
          onWatchProgressChange={setWatch}
        />
        {belowPlayer}
      </div>

      <aside
        aria-labelledby="playlist-title"
        className="surface flex max-h-[min(28rem,60dvh)] flex-col overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)]"
      >
        <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="playlist-title" className="font-semibold text-mist-50">
            Conteúdo deste módulo
          </h2>
          <p className="mt-0.5 text-xs text-mist-400">
            Módulo {moduleNumberLabel} · {completedRequired}/{totalRequired} concluídas
          </p>

          <div className="mt-3">
            {watch.completed ? (
              <p className="flex items-center gap-2 text-sm font-medium text-brand-300" role="status">
                <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> Aula concluída
              </p>
            ) : (
              <>
                <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-mist-400">
                  <span>Critério de conclusão: {watch.minWatchPercent}% assistido</span>
                  <span className="shrink-0">{canComplete ? "Atingido" : `faltam ${formatClock(remaining)}`}</span>
                </div>
                <ProgressBar
                  value={watchedPercent}
                  label="Tempo assistido em relação ao critério de conclusão"
                  size="sm"
                />
              </>
            )}
          </div>
        </div>

        {playlistLessons}
      </aside>
    </div>
  );
}
