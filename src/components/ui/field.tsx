import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-xl border border-white/10 bg-ink-900/80 px-3.5 text-sm text-mist-50 placeholder:text-mist-500 transition-colors focus:border-brand-400/70 focus:ring-2 focus:ring-brand-400/20 focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-danger-400/70";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("text-sm font-medium text-mist-100", className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(CONTROL, "h-11 appearance-auto", className)} {...props} />;
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-xs text-danger-400">
      {children}
    </p>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-mist-500">{hint}</p>}
      <FieldError id={`${htmlFor}-error`}>{error}</FieldError>
    </div>
  );
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn("size-4 rounded border-white/20 bg-ink-900 accent-brand-500", className)}
      {...props}
    />
  );
}
