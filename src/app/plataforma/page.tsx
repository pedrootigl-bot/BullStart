import { BookOpen, CheckCircle2, Layers, Play, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import { ModuleSection } from "@/components/platform/module-blocks";
import { FlashToast } from "@/components/platform/flash-toast";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { ProgressRing } from "@/components/ui/progress";
import { getStudentContext } from "@/lib/access/student";
import { firstName } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Minha formação" };

const STAT_CARD = "surface flex flex-col items-center gap-1.5 px-2 py-3 text-center sm:p-4";
const STAT_LABEL = "text-[11px] tracking-wide text-mist-400 uppercase";
const STAT_VALUE = "flex h-11 items-center justify-center";

const FLASH: Record<string, { tone: "success" | "error" | "info"; message: string }> = {
  "acesso-restrito": { tone: "error", message: "Você não tem permissão para acessar a área administrativa." },
  "deposito-indisponivel": { tone: "info", message: "A área de depósito oficial não está disponível no momento." },
};

export default async function DashboardPage({ searchParams }: PageProps<"/plataforma">) {
  const params = await searchParams;
  const { session, snapshot, depositConfigured } = await getStudentContext();
  const flash =
    typeof params.erro === "string"
      ? FLASH[params.erro]
      : params.senha === "atualizada"
        ? { tone: "success" as const, message: "Senha atualizada com sucesso." }
        : params["boas-vindas"]
          ? { tone: "success" as const, message: "Conta criada! Sua jornada começa agora." }
          : undefined;

  if (!snapshot) {
    return (
      <EmptyState
        icon={<BookOpen className="size-6" />}
        title="A formação está sendo preparada"
        description="Os módulos ainda não foram publicados. Volte em breve para começar sua jornada."
      />
    );
  }

  const { overall, resume } = snapshot;

  return (
    <div className="flex flex-col gap-12">
      {flash && <FlashToast tone={flash.tone} message={flash.message} />}

      <section
        aria-labelledby="boas-vindas"
        className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-linear-to-br from-ink-800 via-ink-850 to-ink-900 p-6 sm:p-8 lg:p-10"
      >
        <div className="grid-bg absolute inset-0 opacity-60 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <div className="absolute -top-32 right-0 size-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{snapshot.course.title}</p>
            <h1 id="boas-vindas" className="mt-3 text-2xl font-semibold text-balance text-mist-50 sm:text-3xl lg:text-4xl">
              Bem-vindo à sua jornada, <span className="text-gradient-brand">{firstName(session.profile.full_name)}</span>.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-mist-300 sm:text-base">
              Continue sua evolução no Bullex Start e acompanhe cada etapa da sua formação.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              {resume ? (
                <ButtonLink href={`/plataforma/aula/${resume.lessonId}`} size="lg" className="w-full sm:w-auto">
                  <Play className="size-5 fill-current" aria-hidden="true" /> Continuar estudando
                </ButtonLink>
              ) : (
                <ButtonLink href="/plataforma/certificado" size="lg" variant="gold" className="w-full sm:w-auto">
                  Ver meu certificado
                </ButtonLink>
              )}
              {resume && (
                <p className="truncate text-sm text-mist-400">
                  <span className="text-mist-500">Próxima: </span>
                  {resume.title}
                </p>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 sm:gap-4 lg:w-[420px]">
            <div className={STAT_CARD}>
              <Layers className="size-5 text-brand-400" aria-hidden="true" />
              <dt className={STAT_LABEL}>
                Módulos<span className="hidden sm:inline"> disponíveis</span>
              </dt>
              <dd className={cn(STAT_VALUE, "text-xl font-semibold text-mist-50")}>
                {overall.unlockedModules}
                <span className="text-sm text-mist-500">/{snapshot.modules.length}</span>
              </dd>
            </div>
            <div className={STAT_CARD}>
              <CheckCircle2 className="size-5 text-brand-400" aria-hidden="true" />
              <dt className={STAT_LABEL}>
                Aulas<span className="hidden sm:inline"> concluídas</span>
              </dt>
              <dd className={cn(STAT_VALUE, "text-xl font-semibold text-mist-50")}>
                {overall.completedLessons}
                <span className="text-sm text-mist-500">/{overall.totalLessons}</span>
              </dd>
            </div>
            <div className={STAT_CARD}>
              <TrendingUp className="size-5 text-brand-400" aria-hidden="true" />
              <dt className={STAT_LABEL}>
                Progresso<span className="hidden sm:inline"> geral</span>
              </dt>
              <dd className={STAT_VALUE}>
                <ProgressRing value={overall.percent} size={44} label="Progresso geral" />
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {snapshot.modules.map((module) => (
        <ModuleSection key={module.id} snapshot={snapshot} module={module} depositConfigured={depositConfigured} />
      ))}
    </div>
  );
}
