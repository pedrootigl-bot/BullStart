import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-ink-950 hover:bg-brand-400 shadow-[0_10px_30px_-12px_rgb(31_216_119/0.7)] hover:shadow-[0_14px_36px_-12px_rgb(31_216_119/0.85)]",
  secondary: "bg-ink-700 text-mist-50 hover:bg-ink-600 border border-white/10",
  ghost: "text-mist-100 hover:bg-white/5",
  outline: "border border-white/15 text-mist-50 hover:border-brand-400/60 hover:text-brand-300 bg-transparent",
  danger: "bg-danger-400/10 text-danger-400 border border-danger-400/30 hover:bg-danger-400/20",
  gold: "bg-linear-to-r from-gold-300 to-gold-500 text-ink-950 hover:brightness-110",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 py-1.5 px-3.5 text-sm gap-1.5",
  md: "min-h-11 py-2 px-5 text-sm gap-2",
  lg: "min-h-12 py-2.5 px-5 text-[0.9375rem] gap-2.5 sm:min-h-13 sm:px-7 sm:text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex max-w-full items-center justify-center rounded-xl text-center leading-tight font-semibold [overflow-wrap:normal] transition-all duration-200 sm:shrink-0 sm:whitespace-nowrap",
    "disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
