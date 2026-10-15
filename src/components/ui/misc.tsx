import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-xl bg-white/[0.05]", className)} />;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="min-w-0">
      <ol className="flex min-w-0 flex-wrap items-center gap-1 text-sm text-mist-400">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li
              key={`${item.label}-${index}`}
              className={cn("flex min-w-0 items-center gap-1", last && "max-w-full basis-full sm:basis-auto sm:max-w-[min(100%,22rem)]")}
            >
              {item.href && !last ? (
                <Link href={item.href} className="truncate transition-colors hover:text-brand-300">
                  {item.label}
                </Link>
              ) : (
                <span className={cn("truncate", last && "text-mist-100")} aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0 text-mist-500" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-white/5 text-brand-400">{icon}</div>
      <h2 className="text-lg font-semibold text-mist-50">{title}</h2>
      <p className="max-w-md text-sm text-mist-400">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  id,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div className={cn("flex max-w-3xl flex-col gap-4", align === "center" && "mx-auto items-center text-center")}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id} className="text-3xl leading-tight font-semibold text-balance text-mist-50 sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description && <p className="text-base leading-relaxed text-pretty text-mist-300 sm:text-lg">{description}</p>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode }) {
  return (
    <div className="surface flex items-start gap-3 p-4 max-sm:flex-col max-sm:gap-2.5 max-sm:p-3.5">
      {icon && (
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500/10 text-brand-400 max-sm:size-9">{icon}</div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-mist-400 uppercase">{label}</p>
        <p className="mt-1 text-xl font-semibold text-mist-50">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-mist-500">{hint}</p>}
      </div>
    </div>
  );
}
