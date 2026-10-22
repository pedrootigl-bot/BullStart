import { Award, GraduationCap, PlayCircle } from "lucide-react";

const CANDLES = [
  { x: 40, open: 230, close: 205, high: 195, low: 242 },
  { x: 72, open: 205, close: 218, high: 198, low: 228 },
  { x: 104, open: 218, close: 186, high: 176, low: 224 },
  { x: 136, open: 186, close: 196, high: 178, low: 204 },
  { x: 168, open: 196, close: 160, high: 150, low: 202 },
  { x: 200, open: 160, close: 170, high: 152, low: 178 },
  { x: 232, open: 170, close: 136, high: 126, low: 176 },
  { x: 264, open: 136, close: 148, high: 128, low: 156 },
  { x: 296, open: 148, close: 112, high: 100, low: 154 },
  { x: 328, open: 112, close: 122, high: 104, low: 132 },
  { x: 360, open: 122, close: 88, high: 76, low: 128 },
  { x: 392, open: 88, close: 96, high: 80, low: 104 },
];

/** Ilustração do hero: gráfico de candles (aprendizado técnico) + cartões de evolução na formação. */
export function HeroVisual({ moduleCount }: { moduleCount: number }) {
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
      <div className="absolute -inset-10 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="surface-raised relative overflow-hidden p-5 shadow-2xl shadow-black/50 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-danger-400/70" />
            <span className="size-2.5 rounded-full bg-warning-400/70" />
            <span className="size-2.5 rounded-full bg-brand-400/70" />
          </div>
          <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-mist-400">
            Módulo 03 · Leitura de gráficos
          </span>
        </div>
        <svg viewBox="0 0 430 270" className="h-auto w-full">
          <defs>
            <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0abf04" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0abf04" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[60, 110, 160, 210].map((y) => (
            <line key={y} x1="20" x2="420" y1={y} y2={y} stroke="rgb(255 255 255 / 0.05)" />
          ))}
          <path
            d="M40 225 C 90 215, 120 190, 168 178 S 250 150, 296 128 S 370 100, 410 84 L 410 260 L 40 260 Z"
            fill="url(#hero-area)"
          />
          <path
            d="M40 225 C 90 215, 120 190, 168 178 S 250 150, 296 128 S 370 100, 410 84"
            fill="none"
            stroke="#e2c06a"
            strokeWidth="2"
            strokeDasharray="1200"
            className="animate-draw"
            style={{ strokeDashoffset: 1200 }}
          />
          {CANDLES.map((c) => {
            const up = c.close < c.open;
            const color = up ? "#0abf04" : "#ff7a7a";
            const top = Math.min(c.open, c.close);
            return (
              <g key={c.x}>
                <line x1={c.x} x2={c.x} y1={c.high} y2={c.low} stroke={color} strokeWidth="1.5" opacity="0.8" />
                <rect x={c.x - 7} y={top} width="14" height={Math.max(4, Math.abs(c.open - c.close))} rx="2" fill={color} />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="surface-raised animate-float absolute -bottom-8 -left-3 flex items-center gap-3 p-3.5 pr-5 shadow-xl shadow-black/40 sm:-left-10">
        <div className="grid size-10 place-items-center rounded-xl bg-brand-500/15 text-brand-400">
          <GraduationCap className="size-5" />
        </div>
        <div>
          <p className="text-[11px] text-mist-400">Sua formação</p>
          <p className="text-sm font-semibold text-mist-50">
            {moduleCount > 0 ? `${moduleCount} módulos · ` : ""}do básico ao avançado
          </p>
        </div>
      </div>

      <div
        className="surface-raised animate-float absolute -top-6 -right-2 hidden items-center gap-3 p-3.5 pr-5 shadow-xl shadow-black/40 sm:flex"
        style={{ animationDelay: "1.4s" }}
      >
        <div className="grid size-10 place-items-center rounded-xl bg-gold-400/15 text-gold-300">
          <Award className="size-5" />
        </div>
        <div>
          <p className="text-[11px] text-mist-400">Ao concluir</p>
          <p className="text-sm font-semibold text-mist-50">Certificado verificável</p>
        </div>
      </div>

      <div className="absolute right-6 -bottom-5 hidden items-center gap-2 rounded-full border border-white/10 bg-ink-800/90 px-3 py-1.5 text-xs text-mist-300 backdrop-blur sm:flex">
        <PlayCircle className="size-4 text-brand-400" /> Aulas em vídeo
      </div>
    </div>
  );
}
