import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  label,
  className,
  tone = "brand",
  size = "md",
}: {
  value: number;
  label: string;
  className?: string;
  tone?: "brand" | "gold";
  size?: "sm" | "md";
}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      className={cn("w-full overflow-hidden rounded-full bg-white/[0.06]", size === "sm" ? "h-1.5" : "h-2", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "brand" ? "bg-linear-to-r from-brand-600 to-brand-400" : "bg-linear-to-r from-gold-500 to-gold-300",
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function ProgressRing({ value, size = 64, label }: { value: number; size?: number; label: string }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  // Traço fino e anel um pouco mais afastado da borda = folga clara até o percentual
  const stroke = Math.max(3, Math.round(size * 0.075));
  const gap = Math.max(3.5, size * 0.09);
  const radius = size / 2 - stroke / 2 - gap;
  const circumference = 2 * Math.PI * radius;
  const fontSize = Math.max(9, Math.round(size * 0.2));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label}: ${clamped}%`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgb(255 255 255 / 0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-brand-400)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span
        className="absolute leading-none font-semibold tracking-tight text-mist-50 tabular-nums"
        style={{ fontSize }}
      >
        {clamped}%
      </span>
    </div>
  );
}
