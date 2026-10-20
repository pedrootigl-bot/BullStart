"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Play, VideoOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { WatchProgress } from "@/components/player/playlist";
import { Button, buttonClasses } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";

type ProgressResponse =
  | {
      ok: true;
      status: "in_progress" | "completed";
      watchedSeconds: number;
      requiredSeconds: number;
      canComplete: boolean;
      lastPositionSeconds: number;
    }
  | { ok: false; error: { code: string; message: string } };

type NavTarget = { href: string; title: string } | null;

const HEARTBEAT_MS = 15_000;

export function LessonWorkspace({
  lessonId,
  title,
  initialSrc,
  durationSeconds,
  initialPosition,
  initialWatched,
  requiredSeconds,
  initiallyCompleted,
  previous,
  next,
  minWatchPercent,
  showWatchProgress = true,
  onWatchProgressChange,
}: {
  lessonId: string;
  title: string;
  initialSrc: string | null;
  durationSeconds: number;
  initialPosition: number;
  initialWatched: number;
  requiredSeconds: number;
  initiallyCompleted: boolean;
  previous: NavTarget;
  next: NavTarget;
  minWatchPercent: number;
  /** Quando false, a barra fica em outro lugar (ex.: card da playlist). */
  showWatchProgress?: boolean;
  onWatchProgressChange?: (progress: WatchProgress) => void;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingRef = useRef(0);
  const lastTimeRef = useRef(0);
  const startedRef = useRef(initialWatched > 0 || initialPosition > 0);
  const lastRefreshRef = useRef(0);
  const seekTargetRef = useRef<{ at: number; announce: boolean } | null>(
    initialPosition > 5 ? { at: initialPosition, announce: true } : null,
  );
  const inflightRef = useRef(false);
  const metadataHandledRef = useRef<string | null>(null);

  const [src, setSrc] = useState(initialSrc);
  const [needsUserPlay, setNeedsUserPlay] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [watched, setWatched] = useState(initialWatched);
  const [lastPosition, setLastPosition] = useState(initialPosition);
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [completing, setCompleting] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(initialSrc ? null : "Vídeo indisponível para esta aula no momento.");

  const canComplete = completed || watched >= requiredSeconds || lastPosition >= requiredSeconds;
  const remaining = Math.max(0, requiredSeconds - Math.max(watched, lastPosition));

  useEffect(() => {
    onWatchProgressChange?.({
      watchedSeconds: watched,
      requiredSeconds,
      completed,
      minWatchPercent,
    });
  }, [watched, requiredSeconds, completed, minWatchPercent, onWatchProgressChange]);

  const flush = useCallback(
    async ({ keepalive = false, force = false }: { keepalive?: boolean; force?: boolean } = {}) => {
      const video = videoRef.current;
      if (!video || (inflightRef.current && !keepalive && !force)) return;
      const claimed = Math.min(120, Math.floor(pendingRef.current));
      if (claimed <= 0 && !force) return;
      pendingRef.current -= claimed;
      inflightRef.current = true;
      try {
        const position = Math.min(
          durationSeconds,
          Math.max(0, Math.floor(Number.isFinite(video.currentTime) ? video.currentTime : 0)),
        );
        const response = await fetch(`/api/lessons/${lessonId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position, watchedSeconds: claimed }),
          keepalive,
        });
        const body = (await response.json()) as ProgressResponse;
        if (body.ok) {
          setWatched(body.watchedSeconds);
          setLastPosition(body.lastPositionSeconds);
          if (body.status === "completed") setCompleted(true);
          return body;
        }
        if (response.status === 401 || response.status === 403) {
          toast.error(body.error.message);
        }
      } catch {
        pendingRef.current += claimed;
      } finally {
        inflightRef.current = false;
      }
      return null;
    },
    [durationSeconds, lessonId],
  );

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => void flush(), HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [playing, flush]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush({ keepalive: true });
    };
    const onPageHide = () => void flush({ keepalive: true });
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      void flush({ keepalive: true });
    };
  }, [flush]);

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setNeedsUserPlay(false);
    } catch {
      setNeedsUserPlay(true);
    }
  }, []);

  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video || metadataHandledRef.current === video.currentSrc) return;
    metadataHandledRef.current = video.currentSrc;
    const target = seekTargetRef.current;
    seekTargetRef.current = null;
    if (target) {
      const limit = (Number.isFinite(video.duration) ? video.duration : durationSeconds) - 5;
      if (target.at < limit) {
        video.currentTime = target.at;
        if (target.announce) toast.info(`Retomando de ${formatClock(target.at)}`, { duration: 2500 });
      }
    }
    lastTimeRef.current = video.currentTime;
    void tryPlay();
  }, [durationSeconds, tryPlay]);

  // O <video> vem do SSR já carregando: os metadados podem chegar antes da hidratação,
  // quando o handler onLoadedMetadata ainda não existe.
  useEffect(() => {
    const video = videoRef.current;
    if (video && video.readyState >= HTMLMediaElement.HAVE_METADATA) onLoadedMetadata();
  }, [src, onLoadedMetadata]);

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const delta = video.currentTime - lastTimeRef.current;
    if (!video.paused && delta > 0 && delta < 1.5) pendingRef.current += delta;
    lastTimeRef.current = video.currentTime;
  };

  const onPlay = () => {
    setPlaying(true);
    setNeedsUserPlay(false);
    if (!startedRef.current) {
      startedRef.current = true;
      void flush({ force: true });
    }
  };

  const onPause = () => {
    setPlaying(false);
    void flush();
  };

  const onEnded = () => {
    setPlaying(false);
    const video = videoRef.current;
    // Garante crédito do trecho final: o servidor libera a conclusão ao detectar o fim do vídeo.
    if (video) {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration;
      }
      const remainingWatch = Math.max(0, durationSeconds - Math.floor(watched));
      pendingRef.current = Math.max(pendingRef.current, remainingWatch, 1);
      lastTimeRef.current = durationSeconds;
    }
    void (async () => {
      await flush({ force: true });
      try {
        const response = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
        const body = (await response.json()) as { ok: boolean };
        if (body.ok) {
          setCompleted(true);
          toast.success("Aula concluída! Seu progresso foi atualizado.");
          router.refresh();
        }
      } catch {
        /* o botão manual continua disponível */
      }
    })();
  };

  const onError = async () => {
    const video = videoRef.current;
    if (!video) return;
    const now = Date.now();
    if (now - lastRefreshRef.current < 60_000) {
      setVideoError("Não foi possível carregar o vídeo. Verifique sua conexão e recarregue a página.");
      return;
    }
    lastRefreshRef.current = now;
    const resumeAt = lastTimeRef.current;
    try {
      const response = await fetch(`/api/lessons/${lessonId}/playback`, { cache: "no-store" });
      const body = (await response.json()) as { ok: boolean; url?: string; error?: { message: string } };
      if (body.ok && body.url) {
        seekTargetRef.current = { at: resumeAt, announce: false };
        setSrc(body.url);
        return;
      }
      setVideoError(body.error?.message ?? "Vídeo indisponível.");
    } catch {
      setVideoError("Não foi possível carregar o vídeo. Verifique sua conexão.");
    }
  };

  const markComplete = async () => {
    setCompleting(true);
    await flush({ force: true });
    try {
      const response = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST" });
      const body = (await response.json()) as { ok: boolean; error?: { message: string } };
      if (body.ok) {
        setCompleted(true);
        toast.success("Aula concluída! Seu progresso foi atualizado.");
        router.refresh();
      } else {
        toast.error(body.error?.message ?? "Não foi possível concluir a aula.");
      }
    } catch {
      toast.error("Falha de conexão ao concluir a aula.");
    } finally {
      setCompleting(false);
    }
  };

  const progressSeconds = Math.max(watched, lastPosition);
  const watchedPercent = requiredSeconds > 0 ? Math.min(100, (progressSeconds / requiredSeconds) * 100) : 100;

  return (
    <div className="flex flex-col gap-5">
      <div className="relative aspect-video w-full max-w-full overflow-hidden rounded-xl border border-white/[0.07] bg-black shadow-2xl shadow-black/50 sm:rounded-2xl">
        {src && !videoError ? (
          <>
            <video
              ref={videoRef}
              key={src}
              src={src}
              className="size-full max-h-[min(70dvh,100%)] bg-black object-contain"
              controls
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onContextMenu={(event) => event.preventDefault()}
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              onPlay={onPlay}
              onPause={onPause}
              onEnded={onEnded}
              onError={onError}
              aria-label={`Vídeo da aula: ${title}`}
            />
            {needsUserPlay && (
              <button
                type="button"
                onClick={() => void tryPlay()}
                className="absolute inset-0 grid place-items-center bg-ink-950/60 backdrop-blur-[2px] transition-colors hover:bg-ink-950/50"
                aria-label="Reproduzir aula"
              >
                <span className="flex flex-col items-center gap-2 sm:gap-3">
                  <span className="grid size-16 place-items-center rounded-full bg-brand-500 text-ink-950 shadow-glow sm:size-20">
                    <Play className="ml-0.5 size-7 fill-current sm:ml-1 sm:size-9" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-mist-50">Assistir aula</span>
                </span>
              </button>
            )}
          </>
        ) : (
          <div className="grid size-full place-items-center p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <VideoOff className="size-10 text-mist-500" aria-hidden="true" />
              <p className="max-w-sm text-sm text-mist-300">{videoError ?? "Vídeo indisponível."}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        {showWatchProgress && (
          <div className="min-w-0">
            {completed ? (
              <p className="flex items-center gap-2 text-sm font-medium text-brand-300" role="status">
                <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" /> Aula concluída
              </p>
            ) : (
              <div>
                <div className="mb-1.5 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-mist-400">
                  <span>Critério de conclusão: {minWatchPercent}% assistido</span>
                  <span className="shrink-0">{canComplete ? "Atingido" : `faltam ${formatClock(remaining)}`}</span>
                </div>
                <ProgressBar value={watchedPercent} label="Tempo assistido em relação ao critério de conclusão" size="sm" />
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
          {previous ? (
            <Link
              href={previous.href}
              className={buttonClasses({ variant: "secondary", size: "sm", className: "w-full sm:w-auto" })}
              title={previous.title}
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Anterior</span>
            </Link>
          ) : (
            <span
              className={cn(buttonClasses({ variant: "secondary", size: "sm", className: "w-full sm:w-auto" }), "pointer-events-none opacity-40")}
              aria-disabled="true"
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">Anterior</span>
            </span>
          )}
          {!completed && (
            <Button
              size="sm"
              onClick={markComplete}
              disabled={!canComplete || completing}
              aria-busy={completing}
              title={
                canComplete
                  ? "Marcar esta aula como concluída"
                  : `Assista ${minWatchPercent}% da aula sem pular, ou vá até o final do vídeo (faltam ${formatClock(remaining)}).`
              }
              className="order-first col-span-2 w-full sm:order-none sm:col-span-1 sm:w-auto"
            >
              {completing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
              Marcar como concluída
            </Button>
          )}
          {next ? (
            <Link
              href={next.href}
              className={buttonClasses({ variant: completed ? "primary" : "secondary", size: "sm", className: "w-full sm:w-auto" })}
              title={next.title}
            >
              <span className="truncate">Próxima</span> <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
            </Link>
          ) : (
            <Link href="/plataforma" className={buttonClasses({ variant: "secondary", size: "sm", className: "w-full sm:w-auto" })}>
              Voltar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
