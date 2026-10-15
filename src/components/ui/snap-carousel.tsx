"use client";

import { Children, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Carrossel com scroll-snap apenas abaixo de `sm`; a partir dele os itens voltam ao grid
 * definido em `gridClassName` (classes com prefixo `sm:`/`lg:`).
 */
const GUTTERS = {
  page: "-mx-5 px-5 scroll-px-5",
  platform: "-mx-4 px-4 scroll-px-4",
} as const;

export function SnapCarousel({
  children,
  gridClassName,
  itemLabel,
  gutter = "page",
  className,
}: {
  children: ReactNode;
  gridClassName: string;
  itemLabel: string;
  /** Deve casar com o padding horizontal do container para o carrossel encostar nas bordas da tela. */
  gutter?: keyof typeof GUTTERS;
  className?: string;
}) {
  const trackRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const count = Children.count(children);

  const onScroll = () => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) {
      setActive(count - 1);
      return;
    }
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
    setActive(Math.min(count - 1, Math.round(track.scrollLeft / step)));
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    const item = track?.children[index] as HTMLElement | undefined;
    if (!track || !item) return;
    const padding = parseFloat(getComputedStyle(track).paddingLeft || "0");
    const left = track.scrollLeft + item.getBoundingClientRect().left - track.getBoundingClientRect().left - padding;
    setActive(index);
    track.scrollTo({ left, behavior: "smooth" });
  };

  return (
    <div className={className}>
      <ol
        ref={trackRef}
        onScroll={onScroll}
        className={cn(
          "scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto py-2",
          GUTTERS[gutter],
          "[&>li]:w-[85%] [&>li]:shrink-0 [&>li]:snap-start",
          "sm:mx-0 sm:grid sm:overflow-visible sm:p-0 sm:[&>li]:w-auto",
          gridClassName,
        )}
      >
        {children}
      </ol>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1 sm:hidden">
          {Array.from({ length: count }, (_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Ir para ${itemLabel} ${index + 1} de ${count}`}
              aria-current={index === active ? "true" : undefined}
              className="grid h-6 place-items-center px-0.5"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all duration-300",
                  index === active ? "w-6 bg-brand-400" : "w-2 bg-white/20",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
