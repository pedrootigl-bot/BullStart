import { Lock, Play } from "lucide-react";
import { cn } from "@/lib/cn";

const HUES = [152, 160, 168, 145, 138, 175];

export function LessonThumb({
  thumbnailUrl,
  modulePosition,
  lessonPosition,
  locked = false,
  className,
  showPlay = true,
  compactOnMobile = false,
}: {
  thumbnailUrl: string | null;
  modulePosition: number;
  lessonPosition: number;
  locked?: boolean;
  className?: string;
  showPlay?: boolean;
  compactOnMobile?: boolean;
}) {
  const hue = HUES[(modulePosition - 1) % HUES.length];
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-xl bg-ink-800", className)}>
      {thumbnailUrl ? (
        // Miniaturas podem vir de hosts definidos pelo administrador; validadas no cadastro.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 15%, hsl(${hue} 70% 45% / 0.35), transparent 55%), radial-gradient(circle at 85% 90%, hsl(45 70% 55% / 0.16), transparent 50%), linear-gradient(135deg, #141918, #0a0d0c)`,
          }}
        >
          <svg viewBox="0 0 160 90" className="absolute inset-0 size-full opacity-40" aria-hidden="true" preserveAspectRatio="none">
            <polyline
              points={`0,${70 - lessonPosition * 3} 30,${60 - lessonPosition * 2} 55,64 85,${44 - lessonPosition} 115,48 160,${26 - lessonPosition}`}
              fill="none"
              stroke="#46eb93"
              strokeWidth="1.2"
            />
          </svg>
          <span
            className={cn(
              "absolute bottom-2 left-3 text-[11px] font-semibold tracking-widest text-white/50",
              compactOnMobile && "max-sm:hidden",
            )}
          >
            M{String(modulePosition).padStart(2, "0")} · A{String(lessonPosition).padStart(2, "0")}
          </span>
        </div>
      )}
      <div className={cn("absolute inset-0 transition-colors", locked ? "bg-ink-950/60" : "bg-transparent group-hover:bg-ink-950/20")} />
      {showPlay && (
        <span
          className={cn(
            "absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full backdrop-blur transition-transform duration-300",
            locked ? "bg-ink-900/80 text-mist-400" : "bg-brand-500/90 text-ink-950 group-hover:scale-110",
            compactOnMobile && "max-sm:size-8",
          )}
          aria-hidden="true"
        >
          {locked ? (
            <Lock className={cn("size-4.5", compactOnMobile && "max-sm:size-3.5")} />
          ) : (
            <Play className={cn("ml-0.5 size-5 fill-current", compactOnMobile && "max-sm:size-4")} />
          )}
        </span>
      )}
    </div>
  );
}
