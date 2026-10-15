import { Link2, Link2Off, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProfileNameForm } from "@/components/platform/profile-name-form";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs, EmptyState } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { getStudentContext } from "@/lib/access/student";
import { getActiveCertificate } from "@/lib/certificates/service";
import { formatDate, formatDateTime, moduleNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Meu perfil" };

const ELIGIBILITY_LABEL = { eligible: "Atendido", not_eligible: "Não atendido", pending: "Aguardando confirmação" } as const;
const ELIGIBILITY_TONE = { eligible: "brand", not_eligible: "neutral", pending: "warning" } as const;

export default async function ProfilePage() {
  const { session, snapshot } = await getStudentContext("/plataforma/perfil");
  const { profile } = session;
  const certificate = snapshot ? await getActiveCertificate(profile.id, snapshot.course.id) : null;

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumbs items={[{ label: "Minha formação", href: "/plataforma" }, { label: "Perfil" }]} />
      <h1 className="text-2xl font-semibold text-mist-50 sm:text-3xl">Meu perfil</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface flex flex-col gap-5 p-5 sm:p-6" aria-labelledby="dados">
          <h2 id="dados" className="flex items-center gap-2 font-semibold text-mist-50">
            <UserRound className="size-5 text-brand-400" aria-hidden="true" /> Dados da conta
          </h2>
          <ProfileNameForm initialName={profile.full_name} locked={Boolean(certificate)} />
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-mist-500">E-mail</dt>
              <dd className="mt-0.5 break-all text-mist-100">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-mist-500">Aluno desde</dt>
              <dd className="mt-0.5 text-mist-100">{formatDate(profile.created_at)}</dd>
            </div>
          </dl>
          <Link href="/recuperar-senha" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            Alterar senha
          </Link>
        </section>

        <section className="surface flex flex-col gap-5 p-5 sm:p-6" aria-labelledby="corretora">
          <h2 id="corretora" className="flex items-center gap-2 font-semibold text-mist-50">
            {profile.broker_user_id ? (
              <Link2 className="size-5 text-brand-400" aria-hidden="true" />
            ) : (
              <Link2Off className="size-5 text-danger-400" aria-hidden="true" />
            )}
            Vínculo com a Bullex
          </h2>
          {profile.broker_user_id ? (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-mist-500">Status do vínculo</dt>
                <dd className="mt-1">
                  <Badge tone="brand">Verificado</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-mist-500">ID do cliente</dt>
                <dd className="mt-0.5 font-mono text-mist-100">{profile.broker_user_id}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Status da conta</dt>
                <dd className="mt-0.5 text-mist-100">{profile.broker_account_status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Verificação</dt>
                <dd className="mt-0.5 text-mist-100">{profile.broker_verification_status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Cadastro na corretora</dt>
                <dd className="mt-0.5 text-mist-100">{formatDate(profile.broker_registered_at)}</dd>
              </div>
              <div>
                <dt className="text-mist-500">Última sincronização</dt>
                <dd className="mt-0.5 text-mist-100">{formatDateTime(profile.broker_last_synced_at)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm leading-relaxed text-mist-400">
              Sua conta ainda não possui vínculo verificado com a corretora. O vínculo é estabelecido automaticamente por
              integração oficial da Bullex, usando o mesmo e-mail verificado — ele nunca é informado manualmente.
            </p>
          )}

          {snapshot && snapshot.eligibility.size > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-mist-100">Requisitos confirmados pela corretora</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {[...snapshot.eligibility.entries()].map(([key, record]) => (
                  <li key={key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-mono text-xs text-mist-400">{key}</span>
                    <Badge tone={ELIGIBILITY_TONE[record.status]}>{ELIGIBILITY_LABEL[record.status]}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {snapshot ? (
        <section className="surface p-5 sm:p-6" aria-labelledby="progresso">
          <h2 id="progresso" className="font-semibold text-mist-50">
            Progresso na formação
          </h2>
          <div className="mt-4 mb-6">
            <div className="mb-2 flex justify-between text-sm text-mist-400">
              <span>Geral</span>
              <span className="font-medium text-mist-100">{snapshot.overall.percent}%</span>
            </div>
            <ProgressBar value={snapshot.overall.percent} label="Progresso geral" />
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {snapshot.modules.map((module) => (
              <li key={module.id} className="min-w-0 rounded-xl border border-white/[0.06] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-sm text-mist-100">
                    <span className="text-mist-500">{moduleNumber(module.position)} · </span>
                    {module.title}
                  </p>
                  {!module.access.unlocked && <Badge>Bloqueado</Badge>}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={module.progress.percent} label={`Progresso do módulo ${module.title}`} size="sm" />
                  <span className="w-10 text-right text-xs text-mist-400">{module.progress.percent}%</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState icon={<UserRound className="size-6" />} title="Sem progresso" description="A formação ainda não foi publicada." />
      )}
    </div>
  );
}
