import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { GrantAccessForm, RevokeAccessButton, RevokeCertificateButton } from "@/components/admin/student-actions";
import { stateLabel } from "@/components/platform/requirement-list";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { loadCourseSnapshot } from "@/lib/access/snapshot";
import { requireAdmin } from "@/lib/auth/session";
import { auditLabel } from "@/lib/audit-labels";
import { formatDate, formatDateTime, moduleNumber } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Aluno" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function accessLabel(via: "requirements" | "manual_grant" | null): string {
  if (via === "requirements") return "Requisitos atendidos";
  if (via === "manual_grant") return "Liberação manual";
  return "Bloqueado";
}

export default async function AdminStudentPage({ params }: PageProps<"/admin/alunos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const db = getSupabaseAdmin();
  const { data: profile } = await db
    .from("profiles")
    .select("id, full_name, email, role, broker_user_id, broker_account_status, broker_verification_status, broker_linked_at, broker_last_synced_at, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const [snapshot, grants, certificates, eligibility, audit] = await Promise.all([
    loadCourseSnapshot(db, profile),
    db.from("module_access").select("module_id, status, reason, expires_at, verified_at, modules(title), granter:profiles!module_access_granted_by_fkey(full_name)").eq("user_id", id),
    db.from("certificates").select("id, verification_code, issued_at, revoked_at, revoked_reason").eq("user_id", id).order("issued_at", { ascending: false }),
    db.from("broker_eligibility").select("requirement_key, eligibility_status, source, checked_at, expires_at").eq("user_id", id),
    db
      .from("audit_logs")
      .select("id, action, metadata, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name)")
      .or(`entity_id.eq.${id},actor_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const allModules = snapshot?.modules.map((m) => ({ id: m.id, title: m.title, position: m.position })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Alunos", href: "/admin/alunos" }, { label: profile.full_name || profile.email }]} />
      <AdminPageHeader title={profile.full_name || "Sem nome"} description={`${profile.email} · cadastrado em ${formatDate(profile.created_at)}`} />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="surface p-5 sm:p-6" aria-labelledby="modulos-aluno">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="modulos-aluno" className="font-semibold text-mist-50">
              Progresso e acesso por módulo
            </h2>
            {snapshot && <span className="text-sm text-mist-400">Geral: {snapshot.overall.percent}%</span>}
          </div>
          {snapshot ? (
            <ul className="mt-4 flex flex-col gap-3">
              {snapshot.modules.map((module) => (
                <li key={module.id} className="rounded-xl border border-white/[0.06] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-mist-100">
                      {moduleNumber(module.position)} · {module.title}
                    </p>
                    <Badge tone={module.access.unlocked ? "brand" : "neutral"}>{accessLabel(module.access.via)}</Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <ProgressBar value={module.progress.percent} label={`Progresso em ${module.title}`} size="sm" />
                    <span className="w-24 text-right text-xs text-mist-400">
                      {module.progress.completedRequired}/{module.progress.totalRequired} aulas
                    </span>
                  </div>
                  {!module.access.unlocked && module.access.outcomes.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-1 text-xs text-mist-500">
                      {module.access.outcomes.map((outcome, i) => (
                        <li key={i}>
                          {outcome.title}: <span className="text-mist-300">{stateLabel(outcome.state)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-mist-500">Curso não publicado.</p>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section className="surface p-5 sm:p-6" aria-labelledby="corretora-aluno">
            <h2 id="corretora-aluno" className="font-semibold text-mist-50">
              Vínculo e elegibilidade
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <dt className="text-mist-500">ID na corretora</dt>
              <dd className="font-mono text-mist-100">{profile.broker_user_id ?? "não vinculado"}</dd>
              <dt className="text-mist-500">Conta</dt>
              <dd className="text-mist-100">{profile.broker_account_status ?? "—"}</dd>
              <dt className="text-mist-500">Verificação</dt>
              <dd className="text-mist-100">{profile.broker_verification_status ?? "—"}</dd>
              <dt className="text-mist-500">Última sincronização</dt>
              <dd className="text-mist-100">{formatDateTime(profile.broker_last_synced_at)}</dd>
            </dl>
            {eligibility.data?.length ? (
              <ul className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                {eligibility.data.map((row) => (
                  <li key={row.requirement_key} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-mist-300">{row.requirement_key}</span>
                    <span className="text-mist-500">
                      {row.eligibility_status} · {row.source} · {formatDateTime(row.checked_at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-xs text-mist-500">Nenhum status de elegibilidade recebido da corretora.</p>
            )}
            <p className="mt-4 text-xs text-mist-500">Dados da corretora são somente leitura e chegam apenas por integração oficial.</p>
          </section>

          <section className="surface p-5 sm:p-6" aria-labelledby="certificados-aluno">
            <h2 id="certificados-aluno" className="font-semibold text-mist-50">
              Certificados
            </h2>
            {certificates.data?.length ? (
              <ul className="mt-3 flex flex-col gap-3">
                {certificates.data.map((cert) => (
                  <li key={cert.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-mono text-mist-100">{cert.verification_code}</p>
                      <p className="text-xs text-mist-500">
                        Emitido em {formatDate(cert.issued_at)}
                        {cert.revoked_at && ` · revogado em ${formatDate(cert.revoked_at)} (${cert.revoked_reason ?? "sem motivo"})`}
                      </p>
                    </div>
                    {!cert.revoked_at && <RevokeCertificateButton certificateId={cert.id} code={cert.verification_code} />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-mist-500">Nenhum certificado emitido.</p>
            )}
          </section>
        </div>
      </div>

      <section className="surface p-5 sm:p-6" aria-labelledby="liberacoes">
        <h2 id="liberacoes" className="font-semibold text-mist-50">
          Liberações manuais
        </h2>
        <p className="mt-1 mb-5 text-sm text-mist-400">
          Uma liberação manual ativa abre o módulo independentemente das regras. Use apenas com justificativa — toda
          ação é auditada.
        </p>
        {grants.data?.length ? (
          <ul className="mb-6 flex flex-col divide-y divide-white/[0.06]">
            {grants.data.map((grant) => (
              <li key={grant.module_id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-mist-100">
                    {grant.modules?.title ?? "Módulo removido"}
                    <Badge tone={grant.status === "granted" ? "brand" : "neutral"}>{grant.status === "granted" ? "Ativa" : "Revogada"}</Badge>
                  </p>
                  <p className="text-xs text-mist-500">
                    {grant.reason} · {grant.granter?.full_name ?? "—"} · {formatDateTime(grant.verified_at)}
                    {grant.expires_at && ` · expira em ${formatDate(grant.expires_at)}`}
                  </p>
                </div>
                {grant.status === "granted" && (
                  <RevokeAccessButton userId={profile.id} moduleId={grant.module_id} moduleTitle={grant.modules?.title ?? "Módulo"} />
                )}
              </li>
            ))}
          </ul>
        ) : null}
        {allModules.length > 0 && <GrantAccessForm userId={profile.id} modules={allModules} />}
      </section>

      <section className="surface p-5 sm:p-6" aria-labelledby="historico">
        <h2 id="historico" className="font-semibold text-mist-50">
          Histórico de auditoria
        </h2>
        {audit.data?.length ? (
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {audit.data.map((entry) => (
              <li key={entry.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-mist-200">{auditLabel(entry.action)}</span>
                <span className="text-xs text-mist-500">
                  {entry.actor?.full_name ?? "Sistema"} · {formatDateTime(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mist-500">Sem registros.</p>
        )}
      </section>
    </div>
  );
}
