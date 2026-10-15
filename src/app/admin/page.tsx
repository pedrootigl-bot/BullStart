import { Award, CheckCircle2, Layers, PlayCircle, Users, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CourseSettingsForm } from "@/components/admin/course-settings-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth/session";
import { getBrokerIntegration } from "@/lib/broker/service";
import { getEnv } from "@/lib/env";
import { auditLabel } from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Visão geral" };

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function StatusRow({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <li className="flex items-start gap-3 py-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-brand-400" aria-label="Configurado" />
      ) : (
        <XCircle className="mt-0.5 size-4.5 shrink-0 text-warning-400" aria-label="Pendente" />
      )}
      <div className="min-w-0">
        <p className="text-sm text-mist-100">{label}</p>
        <p className="text-xs text-mist-500">{detail}</p>
      </div>
    </li>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const env = getEnv();
  const broker = getBrokerIntegration();
  const db = getSupabaseAdmin();

  const since = daysAgoIso(7);
  const [course, students, modules, publishedModules, lessons, publishedLessons, certificates, completions, audit] = await Promise.all([
    db.from("courses").select("id, title, workload_hours, completion_min_watch_ratio").eq("slug", env.PRIMARY_COURSE_SLUG).maybeSingle(),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    db.from("modules").select("id", { count: "exact", head: true }),
    db.from("modules").select("id", { count: "exact", head: true }).eq("is_published", true),
    db.from("lessons").select("id", { count: "exact", head: true }),
    db.from("lessons").select("id", { count: "exact", head: true }).eq("is_published", true),
    db.from("certificates").select("id", { count: "exact", head: true }).is("revoked_at", null),
    db.from("lesson_progress").select("id", { count: "exact", head: true }).eq("status", "completed").gte("completed_at", since),
    db.from("audit_logs").select("id, action, entity_type, created_at, actor:profiles(full_name)").order("created_at", { ascending: false }).limit(8),
  ]);

  return (
    <>
      <AdminPageHeader title="Visão geral" description="Indicadores da formação, configurações de conclusão e estado das integrações." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Alunos" value={students.count ?? 0} icon={<Users className="size-5" />} />
        <StatCard label="Módulos" value={`${publishedModules.count ?? 0}/${modules.count ?? 0}`} hint="publicados / total" icon={<Layers className="size-5" />} />
        <StatCard label="Aulas" value={`${publishedLessons.count ?? 0}/${lessons.count ?? 0}`} hint="publicadas / total" icon={<PlayCircle className="size-5" />} />
        <StatCard label="Certificados ativos" value={certificates.count ?? 0} hint={`${completions.count ?? 0} aulas concluídas em 7 dias`} icon={<Award className="size-5" />} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="surface p-5 sm:p-6" aria-labelledby="config">
          <h2 id="config" className="font-semibold text-mist-50">
            Configurações da formação
          </h2>
          <p className="mt-1 mb-5 text-sm text-mist-400">{course.data?.title ?? "Curso principal não encontrado"}</p>
          {course.data && (
            <CourseSettingsForm
              courseId={course.data.id}
              workloadHours={course.data.workload_hours}
              minWatchRatio={Number(course.data.completion_min_watch_ratio)}
            />
          )}
        </section>

        <section className="surface p-5 sm:p-6" aria-labelledby="integracoes">
          <h2 id="integracoes" className="font-semibold text-mist-50">
            Integrações
          </h2>
          <ul className="mt-2 divide-y divide-white/[0.06]">
            <StatusRow
              label={`Integração Bullex: modo ${broker.mode}`}
              ok={broker.mode === "official" && broker.isAvailable()}
              detail={
                broker.mode === "mock"
                  ? "Simulação local — ignorada automaticamente em produção."
                  : broker.isAvailable()
                    ? "Disponível."
                    : "Aguardando contrato técnico oficial da Bullex (API/SSO)."
              }
            />
            <StatusRow
              label="Webhook assinado da corretora"
              ok={Boolean(env.BROKER_WEBHOOK_SECRET)}
              detail={env.BROKER_WEBHOOK_SECRET ? "Segredo configurado (HMAC SHA-256)." : "Defina BROKER_WEBHOOK_SECRET."}
            />
            <StatusRow
              label="URL oficial de depósito"
              ok={broker.isDepositConfigured()}
              detail={broker.isDepositConfigured() ? "Configurada e validada pela allowlist." : "Defina BROKER_OFFICIAL_DEPOSIT_URL e BROKER_OFFICIAL_ALLOWED_HOSTS."}
            />
            <StatusRow
              label="Vídeos externos"
              ok={env.VIDEO_EXTERNAL_ALLOWED_HOSTS.length > 0}
              detail={
                env.VIDEO_EXTERNAL_ALLOWED_HOSTS.length
                  ? `Hosts autorizados: ${env.VIDEO_EXTERNAL_ALLOWED_HOSTS.join(", ")}`
                  : "Somente Storage privado (opcional configurar VIDEO_EXTERNAL_ALLOWED_HOSTS)."
              }
            />
          </ul>
        </section>
      </div>

      <section className="surface mt-6 p-5 sm:p-6" aria-labelledby="recentes">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recentes" className="font-semibold text-mist-50">
            Atividade administrativa recente
          </h2>
          <Link href="/admin/auditoria" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            Ver auditoria
          </Link>
        </div>
        {audit.data?.length ? (
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {audit.data.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="text-mist-200">{auditLabel(entry.action)}</span>
                <span className="text-xs text-mist-500">
                  {entry.actor?.full_name ?? "Sistema"} · {formatDateTime(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-mist-500">Nenhuma ação registrada ainda.</p>
        )}
      </section>
    </>
  );
}
