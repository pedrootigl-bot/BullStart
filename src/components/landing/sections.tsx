import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Clock,
  Fingerprint,
  Layers,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { CertificateMockup } from "@/components/certificate/certificate-mockup";
import { HeroVisual } from "@/components/landing/hero-visual";
import { LockedModuleAccessButton } from "@/components/landing/locked-module-access";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ModuleLockOverlay } from "@/components/ui/module-lock-overlay";
import { SectionHeading } from "@/components/ui/misc";
import { Reveal } from "@/components/ui/reveal";
import { SnapCarousel } from "@/components/ui/snap-carousel";
import { cn } from "@/lib/cn";
import { formatDuration, moduleNumber } from "@/lib/format";

export type CatalogModule = {
  module_id: string;
  slug: string;
  title: string;
  description: string;
  topics: string[];
  position: number;
  lesson_count: number;
  total_duration_seconds: number;
};

/** Entrada do hero via CSS: roda no primeiro paint, sem depender da hidratação (LCP). */
function Rise({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  return (
    <div className={cn("animate-rise", className)} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

export function Hero({ startHref, moduleCount }: { startHref: string; moduleCount: number }) {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 lg:pb-32" aria-labelledby="hero-title">
      <div className="grid-bg absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute top-0 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-brand-500/[0.08] blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <div className="flex flex-col items-start gap-7">
          <Rise>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/[0.07] px-3.5 py-1.5 text-xs font-medium text-brand-300">
              <span className="animate-pulse-soft size-1.5 rounded-full bg-brand-400" />
              Sua jornada para evoluir como trader começa aqui.
            </span>
          </Rise>
          <Rise delay={0.05}>
            <h1
              id="hero-title"
              className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-mist-50 sm:text-5xl lg:text-[3.6rem]"
            >
              O primeiro passo para se tornar um <span className="text-gradient-brand">trader</span> começa aqui.
            </h1>
          </Rise>
          <Rise delay={0.1}>
            <p className="max-w-xl text-base leading-relaxed text-pretty text-mist-300 sm:text-lg">
              Aprenda os fundamentos do mercado financeiro, desenvolva suas habilidades e avance em uma jornada de
              formação criada pela Bullex.
            </p>
          </Rise>
          <Rise delay={0.15} className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href={startHref} size="lg">
              Começar minha formação <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
            <a href="#sobre" className={buttonClasses({ variant: "outline", size: "lg" })}>
              Conhecer o programa
            </a>
          </Rise>
          <Rise delay={0.2}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-mist-400">
              <li className="flex items-center gap-2">
                <PlayCircle className="size-4 text-brand-400" aria-hidden="true" /> Aulas em vídeo
              </li>
              <li className="flex items-center gap-2">
                <TrendingUp className="size-4 text-brand-400" aria-hidden="true" /> Progresso acompanhado
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-gold-400" aria-hidden="true" /> Certificado de conclusão
              </li>
            </ul>
          </Rise>
        </div>

        <Rise delay={0.15} className="lg:pl-6">
          <HeroVisual moduleCount={moduleCount} />
        </Rise>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    icon: Layers,
    title: "Aprendizado estruturado",
    text: "Conteúdo organizado em uma sequência lógica, dos conceitos essenciais às ferramentas de análise.",
  },
  {
    icon: ListChecks,
    title: "Evolução por módulos",
    text: "Cada módulo prepara o próximo. Você avança no seu ritmo, com etapas claras e objetivos definidos.",
  },
  {
    icon: BookOpenCheck,
    title: "Acompanhamento de progresso",
    text: "Acompanhe aulas concluídas, retome de onde parou e visualize sua evolução em toda a formação.",
  },
];

export function About({ accessHref }: { accessHref: string }) {
  return (
    <section id="sobre" className="relative scroll-mt-24 py-24 lg:py-32" aria-labelledby="sobre-title">
      <div className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <Reveal className="flex flex-col gap-8">
          <SectionHeading
            id="sobre-title"
            eyebrow="01 · Sobre o Bullex Start"
            title="Conhecimento para transformar sua maneira de operar."
            description="O Bullex Start é a plataforma educacional da Bullex, criada para apresentar conceitos, ferramentas e metodologias do mercado financeiro de forma clara, prática e progressiva."
          />
          <p className="text-sm leading-relaxed text-mist-400">
            O foco é educação: compreender como o mercado funciona, ler gráficos com critério, gerenciar riscos e
            desenvolver disciplina. Nenhum conteúdo constitui promessa de resultado ou recomendação de investimento.
          </p>
          <div>
            <ButtonLink href={accessHref} variant="secondary">
              Acessar formação <ArrowRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 0.08}>
              <article className="surface group flex h-full gap-5 p-6 transition-colors duration-300 hover:border-brand-500/30 sm:flex-col lg:flex-row lg:items-center">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-500/10 text-brand-400 transition-transform duration-300 group-hover:scale-105">
                  <pillar.icon className="size-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-mist-50">
                    <span className="mr-2 text-sm text-mist-500">{String(index + 1).padStart(2, "0")}</span>
                    {pillar.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mist-400">{pillar.text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Formation({
  modules,
  moduleHref,
}: {
  modules: CatalogModule[] | null;
  moduleHref: (slug: string) => string;
}) {
  return (
    <section id="formacao" className="relative scroll-mt-24 py-24 lg:py-32" aria-labelledby="formacao-title">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal>
          <SectionHeading
            id="formacao-title"
            eyebrow="02 · Formação, aulas e temas"
            title="Uma jornada de aprendizado, do básico ao avançado."
            description="Módulos sequenciais com aulas objetivas. Alguns módulos possuem requisitos de liberação, apresentados com clareza dentro da plataforma."
          />
        </Reveal>

        {modules === null ? (
          <p className="surface mt-12 p-6 text-sm text-mist-400" role="status">
            Não foi possível carregar os módulos agora. Tente novamente em instantes.
          </p>
        ) : modules.length === 0 ? (
          <p className="surface mt-12 p-6 text-sm text-mist-400" role="status">
            Os módulos da formação estão sendo preparados e serão publicados em breve.
          </p>
        ) : (
          <Reveal className="mt-14">
            <SnapCarousel itemLabel="o módulo" gridClassName="sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {modules.map((module) => {
                const lockedPreview = module.position >= 2 && module.position <= 6;
                return (
                  <li key={module.module_id}>
                    <article className="surface group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-glow">
                      <div className="absolute -top-16 -right-16 size-40 rounded-full bg-brand-500/[0.06] blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                      <div
                        className={cn(
                          "relative flex flex-1 flex-col",
                          lockedPreview && "pointer-events-none select-none",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold tracking-widest text-brand-400">
                            MÓDULO {moduleNumber(module.position)}
                          </span>
                          <span className="text-5xl leading-none font-bold text-white/[0.04]" aria-hidden="true">
                            {moduleNumber(module.position)}
                          </span>
                        </div>
                        <h3 className="mt-3 text-xl font-semibold text-mist-50">{module.title}</h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-mist-400">{module.description}</p>

                        <dl className="mt-5 flex gap-5 text-sm text-mist-300">
                          <div className="flex items-center gap-1.5">
                            <dt className="sr-only">Aulas</dt>
                            <PlayCircle className="size-4 text-mist-500" aria-hidden="true" />
                            <dd>{module.lesson_count} aulas</dd>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <dt className="sr-only">Duração total</dt>
                            <Clock className="size-4 text-mist-500" aria-hidden="true" />
                            <dd>{formatDuration(module.total_duration_seconds)}</dd>
                          </div>
                        </dl>

                        {module.topics.length > 0 && (
                          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Temas principais">
                            {module.topics.slice(0, 4).map((topic) => (
                              <li key={topic} className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs text-mist-300">
                                {topic}
                              </li>
                            ))}
                          </ul>
                        )}

                        {lockedPreview && <ModuleLockOverlay />}
                      </div>

                      <div className="relative z-20 mt-auto pt-6">
                        {lockedPreview ? (
                          <LockedModuleAccessButton moduleLabel={moduleNumber(module.position)} />
                        ) : (
                          <ButtonLink
                            href={moduleHref(module.slug)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                            aria-label={`Acessar o módulo ${moduleNumber(module.position)}: ${module.title}`}
                          >
                            Acessar <ArrowRight className="size-4" aria-hidden="true" />
                          </ButtonLink>
                        )}
                      </div>
                    </article>
                  </li>
                );
              })}
            </SnapCarousel>
          </Reveal>
        )}
      </div>
    </section>
  );
}

const CERT_FEATURES = [
  { icon: BadgeCheck, title: "Certificado de conclusão", text: "Emitido em PDF com seu nome, carga horária e data de conclusão." },
  { icon: PlayCircle, title: "Acompanhamento das aulas", text: "O progresso de cada aula é registrado durante a formação." },
  { icon: ShieldCheck, title: "Validação das etapas obrigatórias", text: "A emissão só é liberada após concluir as aulas obrigatórias." },
  { icon: Fingerprint, title: "Identificador verificável", text: "Cada certificado possui um código único consultável publicamente." },
];

export function CertificateSection({ startHref }: { startHref: string }) {
  return (
    <section id="certificado" className="relative scroll-mt-24 overflow-hidden py-24 lg:py-32" aria-labelledby="certificado-title">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute top-1/3 -left-40 size-[480px] rounded-full bg-gold-400/[0.05] blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <Reveal y={28} className="order-2 lg:order-1">
          <div className="relative mx-auto max-w-xl rotate-[-1.5deg] transition-transform duration-500 hover:rotate-0">
            <CertificateMockup workloadHours={undefined} completedAt="dd de mês de aaaa" />
          </div>
        </Reveal>

        <div className="order-1 flex flex-col gap-8 lg:order-2">
          <Reveal>
            <SectionHeading
              id="certificado-title"
              eyebrow="03 · Certificado"
              title={
                <>
                  Seu conhecimento merece <span className="text-gradient-gold">reconhecimento.</span>
                </>
              }
              description="Alunos elegíveis podem emitir o certificado de conclusão Bullex Start após cumprirem os requisitos educacionais da formação."
            />
          </Reveal>
          <ul className="grid gap-4 sm:grid-cols-2">
            {CERT_FEATURES.map((feature, index) => (
              <li key={feature.title}>
                <Reveal delay={index * 0.06} className="flex gap-3">
                  <feature.icon className="mt-0.5 size-5 shrink-0 text-gold-400" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-mist-50">{feature.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-mist-400">{feature.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal>
            <p className="text-xs leading-relaxed text-mist-500">
              O certificado comprova a conclusão de um programa educacional livre. Não representa habilitação
              profissional, certificação regulatória ou reconhecimento por órgãos oficiais.
            </p>
          </Reveal>
          <Reveal>
            <ButtonLink href={startHref} size="lg" variant="gold">
              Começar minha formação <ArrowRight className="size-5" aria-hidden="true" />
            </ButtonLink>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
