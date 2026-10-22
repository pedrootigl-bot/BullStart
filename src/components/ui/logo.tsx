import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("size-9", className)}>
      <defs>
        <linearGradient id="bxs-mark" x1="0" y1="40" x2="40" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#089803" />
          <stop offset="1" stopColor="#5fe85a" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="#0f1312" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="10.5" fill="none" stroke="rgb(255 255 255 / 0.1)" />
      <path d="M9 28 L16 20 L21 24 L31 12" fill="none" stroke="url(#bxs-mark)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M25 12 H31 V18" fill="none" stroke="#e2c06a" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Bullex Start — início">
      <LogoMark className="transition-transform duration-300 group-hover:-rotate-6" />
      <span className="flex flex-col leading-none whitespace-nowrap">
        <span className="text-[15px] font-bold tracking-[0.14em] text-mist-50">
          BULLEX <span className="text-brand-400">START</span>
        </span>
        <span className="mt-1 text-[10px] font-medium tracking-[0.18em] text-mist-500 uppercase">Formação Trader</span>
      </span>
    </Link>
  );
}

/** Compacto para topbar da plataforma (padrão shell BullVerse). */
export function LogoCompact({ href = "/plataforma", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-[0.55rem] text-inherit no-underline", className)}
      aria-label="Bullex Start — início"
    >
      <LogoMark className="size-8" />
      <span className="text-[1.2rem] font-extrabold tracking-[-0.03em] text-mist-50 italic">
        Bullex <span className="not-italic text-brand-500">Start</span>
      </span>
    </Link>
  );
}
