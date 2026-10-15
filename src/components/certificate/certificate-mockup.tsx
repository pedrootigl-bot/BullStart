import { LogoMark } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

export function CertificateMockup({
  holderName = "Nome do Aluno",
  programName = "Formação Trader Bullex",
  completedAt = "—",
  workloadHours,
  code = "BXS-XXXX-XXXX-XXXX",
  className,
  sample = true,
}: {
  holderName?: string;
  programName?: string;
  completedAt?: string;
  workloadHours?: number;
  code?: string;
  className?: string;
  sample?: boolean;
}) {
  return (
    <figure
      className={cn(
        "relative aspect-[1.414/1] w-full overflow-hidden rounded-2xl border border-gold-400/30 bg-linear-to-br from-ink-800 via-ink-850 to-ink-900 p-[5%] shadow-2xl shadow-black/60",
        className,
      )}
      aria-label={sample ? "Exemplo ilustrativo do certificado Bullex Start" : `Certificado de ${holderName}`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-brand-600 via-brand-400 to-brand-600" />
      <div className="absolute inset-[3%] rounded-xl border border-white/[0.06]" />
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-gold-400/10 blur-3xl" />

      <div className="relative flex h-full flex-col items-center justify-between text-center">
        <div className="flex flex-col items-center gap-[0.4em] text-[clamp(8px,1.6vw,14px)]">
          <LogoMark className="size-[2.6em]" />
          <p className="font-bold tracking-[0.3em] text-brand-400">BULLEX START</p>
          <p className="text-[0.8em] tracking-[0.25em] text-mist-400 uppercase">{programName}</p>
        </div>

        <div className="flex flex-col items-center gap-[0.5em] text-[clamp(8px,1.6vw,14px)]">
          <p className="text-[1.8em] font-semibold tracking-wide text-mist-50">Certificado de Conclusão</p>
          <p className="text-mist-400">Certificamos que</p>
          <p className="text-gradient-gold border-b border-gold-400/40 px-[1.5em] pb-[0.2em] text-[2.1em] font-semibold">
            {holderName}
          </p>
          <p className="max-w-[34em] text-mist-300">
            concluiu o programa educacional {programName}
            {workloadHours ? `, com carga horária de ${workloadHours} horas` : ""}, em {completedAt}.
          </p>
        </div>

        <div className="flex w-full items-end justify-between text-left text-[clamp(7px,1.3vw,12px)]">
          <div>
            <p className="text-mist-500">Código de validação</p>
            <p className="font-mono text-[1.25em] font-semibold tracking-wider text-brand-400">{code}</p>
          </div>
          <div className="grid size-[5em] grid-cols-5 grid-rows-5 gap-[2px] rounded-md bg-mist-50 p-[0.4em]" aria-hidden="true">
            {Array.from({ length: 25 }, (_, i) => (
              <span key={i} className={cn("rounded-[1px]", [0, 1, 3, 5, 6, 8, 12, 14, 16, 18, 19, 20, 22, 24].includes(i) ? "bg-ink-950" : "bg-transparent")} />
            ))}
          </div>
        </div>
      </div>

      {sample && (
        <span className="absolute top-[6%] left-[5%] rounded-full border border-white/10 bg-ink-950/60 px-2.5 py-0.5 text-[10px] text-mist-400 max-sm:px-1.5 max-sm:text-[8px]">
          Exemplo<span className="max-sm:hidden"> ilustrativo</span>
        </span>
      )}
    </figure>
  );
}
