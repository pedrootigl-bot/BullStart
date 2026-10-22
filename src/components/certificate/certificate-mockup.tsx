import { LogoMark } from "@/components/ui/logo";
import {
  MEDAL_ARROW_PATH,
  MEDAL_CENTER,
  MEDAL_RADII,
  MEDAL_TREND_PATH,
  MEDAL_VIEWBOX,
  RIBBON_LEFT_FOLD_PATH,
  RIBBON_LEFT_PATH,
  RIBBON_RIGHT_FOLD_PATH,
  RIBBON_RIGHT_PATH,
  laurelLeafPaths,
  rosettePath,
} from "@/lib/certificates/medal";
import { cn } from "@/lib/cn";

const ROSETTE = rosettePath();
const LAUREL = laurelLeafPaths();

function CornerOrnament({ side }: { side: "tl" | "tr" | "bl" | "br" }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn(
        "pointer-events-none absolute size-[7%] text-gold-400",
        side === "tl" && "top-[5.4%] left-[3.9%]",
        side === "tr" && "top-[5.4%] right-[3.9%] -scale-x-100",
        side === "bl" && "bottom-[5.4%] left-[3.9%] -scale-y-100",
        side === "br" && "right-[3.9%] bottom-[5.4%] -scale-100",
      )}
      aria-hidden="true"
    >
      <path d="M2 30 V2 H30" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 22 V7 H22" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <path d="M2 2 L7 7" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <rect x="0" y="0" width="4" height="4" transform="rotate(45 2 2)" fill="currentColor" />
    </svg>
  );
}

function NameDivider() {
  return (
    <div className="flex w-[22em] max-w-full items-center gap-[0.6em]" aria-hidden="true">
      <span className="h-px flex-1 bg-linear-to-r from-transparent to-gold-400/70" />
      <span className="size-[0.45em] rotate-45 bg-gold-400" />
      <span className="h-px flex-1 bg-linear-to-l from-transparent to-gold-400/70" />
    </div>
  );
}

export function CertificateMedal({ className }: { className?: string }) {
  const { x, y } = MEDAL_CENTER;
  return (
    <svg
      viewBox={`0 0 ${MEDAL_VIEWBOX.width} ${MEDAL_VIEWBOX.height}`}
      className={cn("drop-shadow-[0_10px_24px_rgba(226,192,106,0.28)]", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="medal-ribbon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0abf04" />
          <stop offset="100%" stopColor="#067202" />
        </linearGradient>
        <radialGradient id="medal-gold" cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fbeec2" />
          <stop offset="45%" stopColor="#e2c06a" />
          <stop offset="100%" stopColor="#8f6d24" />
        </radialGradient>
        <linearGradient id="medal-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0d999" />
          <stop offset="50%" stopColor="#a8822f" />
          <stop offset="100%" stopColor="#f0d999" />
        </linearGradient>
        <radialGradient id="medal-disc" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#1a221f" />
          <stop offset="100%" stopColor="#070908" />
        </radialGradient>
      </defs>

      <path d={RIBBON_LEFT_PATH} fill="url(#medal-ribbon)" />
      <path d={RIBBON_RIGHT_PATH} fill="url(#medal-ribbon)" />
      <path d={RIBBON_LEFT_FOLD_PATH} fill="#045a01" opacity="0.7" />
      <path d={RIBBON_RIGHT_FOLD_PATH} fill="#045a01" opacity="0.7" />

      <path d={ROSETTE} fill="url(#medal-gold)" />
      <circle cx={x} cy={y} r={MEDAL_RADII.ring} fill="url(#medal-ring)" />
      <circle cx={x} cy={y} r={MEDAL_RADII.face} fill="url(#medal-gold)" />
      <circle cx={x} cy={y} r={MEDAL_RADII.disc} fill="url(#medal-disc)" stroke="#f0d999" strokeWidth="1.2" />
      <circle cx={x} cy={y} r={MEDAL_RADII.disc - 3} fill="none" stroke="#e2c06a" strokeWidth="0.5" opacity="0.5" />

      {LAUREL.map((d) => (
        <path key={d} d={d} fill="#e2c06a" opacity="0.9" />
      ))}

      <path d={MEDAL_TREND_PATH} fill="none" stroke="#2fd429" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d={MEDAL_ARROW_PATH} fill="none" stroke="#f0d999" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      <ellipse cx={x - 8} cy={y - 26} rx="16" ry="5" fill="#fff" opacity="0.18" />
    </svg>
  );
}

function SignatureColumn({ value, label, serif = false }: { value: string; label: string; serif?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-[0.35em]">
      <p className={cn("truncate text-mist-50", serif ? "font-serif text-[1.35em] italic" : "text-[1.05em] font-medium")}>
        {value}
      </p>
      <span className="h-px w-full max-w-[13em] bg-linear-to-r from-transparent via-gold-400/70 to-transparent" />
      <p className="text-[0.82em] tracking-[0.18em] text-mist-500 uppercase">{label}</p>
    </div>
  );
}

export function CertificateMockup({
  holderName = "Nome do Aluno",
  programName = "Formação Trader Bullex",
  completedAt = "dd de mês de aaaa",
  workloadHours,
  className,
  sample = true,
}: {
  holderName?: string;
  programName?: string;
  completedAt?: string;
  workloadHours?: number;
  className?: string;
  sample?: boolean;
}) {
  return (
    <figure
      className={cn(
        "@container relative aspect-[1.414/1] w-full overflow-hidden rounded-xl border border-gold-400/35 bg-[#070908] shadow-2xl shadow-black/70",
        className,
      )}
      aria-label={sample ? "Exemplo ilustrativo do certificado Bullex Start" : `Certificado de ${holderName}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgb(22_34_29)_0%,#070908_70%)]" />
      <div className="absolute -top-1/4 -left-1/4 h-3/4 w-3/4 rotate-12 bg-linear-to-br from-brand-500/15 via-brand-500/[0.04] to-transparent blur-2xl" />
      <div className="absolute -right-1/4 -bottom-1/4 h-3/4 w-3/4 rotate-12 bg-linear-to-tl from-gold-400/15 via-gold-400/[0.04] to-transparent blur-2xl" />

      <div className="absolute inset-[3%] rounded-[0.3em] border border-gold-400/60" />
      <div className="absolute inset-[4.2%] rounded-[0.2em] border border-gold-400/20" />
      <CornerOrnament side="tl" />
      <CornerOrnament side="tr" />
      <CornerOrnament side="bl" />
      <CornerOrnament side="br" />

      <div className="relative flex h-full flex-col items-center px-[9%] pt-[6%] pb-[5%] text-center text-[2.25cqw]">
        <div className="flex flex-col items-center gap-[0.45em]">
          <LogoMark className="size-[2.1em] shadow-[0_0_24px_rgb(10_191_4/0.25)]" />
          <p className="text-[1.05em] font-bold tracking-[0.3em] text-mist-50">
            BULLEX <span className="text-brand-400">START</span>
          </p>
          <div className="flex items-center gap-[0.8em]">
            <span className="h-px w-[2.2em] bg-gold-400/70" />
            <p className="text-[0.72em] tracking-[0.34em] text-mist-300 uppercase">{programName}</p>
            <span className="h-px w-[2.2em] bg-gold-400/70" />
          </div>
        </div>

        <div className="mt-[0.9em] flex flex-col items-center gap-[0.45em]">
          <p className="bg-linear-to-b from-gold-300 via-mist-50 to-gold-400 bg-clip-text font-serif text-[2.25em] leading-none font-semibold tracking-wide text-transparent">
            Certificado de Conclusão
          </p>
          <p className="mt-[0.6em] text-[0.95em] tracking-wide text-mist-400">Certificamos que</p>
          <p className="max-w-full truncate bg-linear-to-b from-gold-300 via-gold-400 to-gold-500 bg-clip-text px-[0.2em] font-serif text-[2.4em] leading-tight font-semibold text-transparent">
            {holderName}
          </p>
          <NameDivider />
          <p className="mt-[0.3em] max-w-[34em] text-[0.98em] leading-relaxed text-mist-300">
            concluiu o programa educacional <span className="font-semibold text-gold-300">{programName}</span>
            {workloadHours ? `, com carga horária de ${workloadHours} horas` : ""}.
          </p>
        </div>

        <div className="mt-auto grid w-full grid-cols-[1fr_auto_1fr] items-end gap-[1.5em]">
          <SignatureColumn value={completedAt} label="Data de conclusão" />
          <CertificateMedal className="w-[5.3em]" />
          <SignatureColumn value="Bullex Academy" label="Emissor" serif />
        </div>
      </div>

      {sample && (
        <span className="absolute top-[6.5%] left-[12%] z-10 rounded-full border border-white/12 bg-ink-950/70 px-2.5 py-0.5 text-[10px] text-mist-400 max-sm:px-1.5 max-sm:text-[8px]">
          Exemplo<span className="max-sm:hidden"> ilustrativo</span>
        </span>
      )}
    </figure>
  );
}
