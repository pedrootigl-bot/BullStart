import { BookOpen, CheckCircle2, ChevronRight, Layers, Play, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ComingSoonModules } from "@/components/platform/coming-soon-modules";
import { ModuleCelebrationHost } from "@/components/platform/module-celebration-host";
import { ModuleSection } from "@/components/platform/module-blocks";
import { FlashToast } from "@/components/platform/flash-toast";
import { QuizzesSummary } from "@/components/platform/quiz-card";
import { WelcomeModal } from "@/components/platform/welcome-modal";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { getStudentContext } from "@/lib/access/student";
import { firstName } from "@/lib/auth/session";
import { filterLaunchModules } from "@/lib/catalog/launch";
import { cn } from "@/lib/cn";
import { loadModuleQuizzes } from "@/lib/quiz/service";

export const metadata: Metadata = { title: "Minha formação" };

const FLASH: Record<string, { tone: "success" | "error" | "info"; message: string }> = {
  "acesso-restrito": { tone: "error", message: "Você não tem permissão para acessar a área administrativa." },
  "deposito-indisponivel": { tone: "info", message: "A área de depósito oficial não está disponível no momento." },
};

export default async function DashboardPage({ searchParams }: PageProps<"/plataforma">) {
  const params = await searchParams;
  const { session, snapshot, depositConfigured } = await getStudentContext();
  // Aceita ?boas-vindas=1 e também ?boas-vindas= (string vazia ainda conta como presente).
  const welcomeParam = params["boas-vindas"];
  const showWelcome =
    typeof welcomeParam === "string"
      ? welcomeParam !== "0" && welcomeParam !== "false"
      : Array.isArray(welcomeParam);
  const flash =
    typeof params.erro === "string"
      ? FLASH[params.erro]
      : params.senha === "atualizada"
        ? { tone: "success" as const, message: "Senha atualizada com sucesso." }
        : undefined;

  if (!snapshot) {
    return (
      <>
        {showWelcome ? <WelcomeModal startHref="/plataforma" /> : null}
        <EmptyState
          icon={<BookOpen className="size-6" />}
          title="A formação está sendo preparada"
          description="Os módulos ainda não foram publicados. Volte em breve para começar sua jornada."
        />
      </>
    );
  }

  const visibleModules = filterLaunchModules(snapshot.modules);
  const visibleIds = new Set(visibleModules.map((m) => m.id));
  const completedLessons = visibleModules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => snapshot.progressByLesson.get(l.id)?.status === "completed").length,
    0,
  );
  const totalLessons = visibleModules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedRequired = visibleModules.reduce((acc, m) => acc + m.progress.completedRequired, 0);
  const totalRequired = visibleModules.reduce((acc, m) => acc + m.progress.totalRequired, 0);
  const percent = totalRequired === 0 ? 0 : Math.floor((completedRequired / totalRequired) * 100);
  const unlockedModules = visibleModules.filter((m) => m.access.unlocked).length;

  const quizzes = (await loadModuleQuizzes(snapshot, session.profile.id)).filter((q) => visibleIds.has(q.moduleId));
  const celebratedModules = quizzes
    .filter((quiz) => {
      if (!quiz.passed) return false;
      const courseModule = visibleModules.find((module) => module.id === quiz.moduleId);
      return courseModule != null && courseModule.progress.percent === 100;
    })
    .map((quiz) => ({ id: quiz.moduleId, title: quiz.moduleTitle }));
  const resumeInLaunch =
    snapshot.resume && visibleModules.some((m) => m.lessons.some((l) => l.id === snapshot.resume?.lessonId))
      ? snapshot.resume
      : null;
  const resumeFallback = (() => {
    for (const courseModule of visibleModules) {
      for (const lesson of courseModule.lessons) {
        if (snapshot.progressByLesson.get(lesson.id)?.status !== "completed") {
          return { lessonId: lesson.id, title: lesson.title, moduleTitle: courseModule.title };
        }
      }
    }
    return null;
  })();
  const resume = resumeInLaunch ?? resumeFallback;

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {flash && <FlashToast tone={flash.tone} message={flash.message} />}
      {showWelcome ? (
        <WelcomeModal startHref={resume ? `/plataforma/aula/${resume.lessonId}` : "/plataforma"} />
      ) : null}
      {!showWelcome ? <ModuleCelebrationHost modules={celebratedModules} /> : null}

      <section
        aria-labelledby="boas-vindas"
        className="relative overflow-hidden rounded-[18px] border border-brand-500/16 bg-[rgb(6_10_7)] p-6 shadow-[0_24px_60px_-36px_rgb(10_191_4/0.45)] sm:p-8"
      >
        <div className="grid-bg absolute inset-0 opacity-50 [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
        <div className="absolute -top-32 right-0 size-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="eyebrow">{snapshot.course.title}</p>
          <h1 id="boas-vindas" className="mt-3 text-2xl font-semibold text-balance text-mist-50 sm:text-3xl lg:text-4xl">
            Bem-vindo, <span className="text-gradient-brand">{firstName(session.profile.full_name)}</span>
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
      </section>

      <section aria-label="Resumo da formação" className="grid gap-3.5 sm:grid-cols-3">
        <Link
          href="/plataforma/cursos"
          className={cn(
            "surface surface-interactive flex items-center gap-4 px-4 py-4 text-left no-underline sm:px-[1.1rem]",
          )}
        >
          <span className="platform-stat-icon" aria-hidden="true">
            <Layers className="size-5" strokeWidth={1.7} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.78rem] font-medium text-mist-400">Módulos disponíveis</span>
            <span className="mt-0.5 block text-xl font-bold text-white">
              {unlockedModules}
              <span className="text-sm font-medium text-mist-500"> / {visibleModules.length}</span>
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-mist-500" aria-hidden="true" />
        </Link>

        <Link
          href={resume ? `/plataforma/aula/${resume.lessonId}` : "/plataforma/cursos"}
          className="surface surface-interactive flex items-center gap-4 px-4 py-4 text-left no-underline sm:px-[1.1rem]"
        >
          <span className="platform-stat-icon" aria-hidden="true">
            <CheckCircle2 className="size-5" strokeWidth={1.7} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.78rem] font-medium text-mist-400">Aulas concluídas</span>
            <span className="mt-0.5 block text-xl font-bold text-white">
              {completedLessons}
              <span className="text-sm font-medium text-mist-500"> / {totalLessons}</span>
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-mist-500" aria-hidden="true" />
        </Link>

        <Link
          href="/plataforma/certificado"
          className="surface surface-interactive flex items-center gap-4 px-4 py-4 text-left no-underline sm:px-[1.1rem]"
        >
          <span className="platform-stat-icon" aria-hidden="true">
            <TrendingUp className="size-5" strokeWidth={1.7} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.78rem] font-medium text-mist-400">Progresso geral</span>
            <span className="mt-0.5 block text-xl font-bold text-white">
              {percent}
              <span className="text-sm font-semibold text-brand-500"> %</span>
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-mist-500" aria-hidden="true" />
        </Link>
      </section>

      {visibleModules.map((module) => (
        <ModuleSection
          key={module.id}
          snapshot={snapshot}
          module={module}
          depositConfigured={depositConfigured}
          quiz={quizzes.find((q) => q.moduleId === module.id) ?? null}
        />
      ))}

      <ComingSoonModules />

      <QuizzesSummary quizzes={quizzes} />
    </div>
  );
}
