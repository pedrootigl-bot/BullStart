import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth/session";
import { auditLabel } from "@/lib/audit-labels";
import { formatDateTime } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Auditoria" };

const PAGE_SIZE = 50;

export default async function AdminAuditPage({ searchParams }: PageProps<"/admin/auditoria">) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(typeof params.pagina === "string" ? params.pagina : "1", 10) || 1);

  const { data: entries, count } = await getSupabaseAdmin()
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, metadata, created_at, actor:profiles!audit_logs_actor_id_fkey(full_name, email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader title="Auditoria" description="Registro imutável de ações administrativas, liberações, emissões de certificado e eventos de integração." />
      {!entries?.length ? (
        <EmptyState icon={<ClipboardList className="size-6" />} title="Sem registros" description="As ações auditadas aparecerão aqui." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-white/[0.06] text-xs tracking-wide text-mist-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Data</th>
                <th scope="col" className="px-5 py-3 font-medium">Ação</th>
                <th scope="col" className="px-5 py-3 font-medium">Autor</th>
                <th scope="col" className="px-5 py-3 font-medium">Entidade</th>
                <th scope="col" className="px-5 py-3 font-medium">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] align-top">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-5 py-3 whitespace-nowrap text-mist-400">{formatDateTime(entry.created_at)}</td>
                  <td className="px-5 py-3">
                    <span className="block text-mist-100">{auditLabel(entry.action)}</span>
                    <span className="font-mono text-[11px] text-mist-500">{entry.action}</span>
                  </td>
                  <td className="px-5 py-3 text-mist-300">{entry.actor?.full_name || entry.actor?.email || "Sistema"}</td>
                  <td className="px-5 py-3 text-xs text-mist-400">
                    {entry.entity_type === "profile" && entry.entity_id ? (
                      <Link href={`/admin/alunos/${entry.entity_id}`} className="text-brand-400 hover:text-brand-300">
                        aluno
                      </Link>
                    ) : (
                      entry.entity_type
                    )}
                  </td>
                  <td className="max-w-md px-5 py-3">
                    <code className="line-clamp-3 font-mono text-[0.7rem] break-all text-mist-500">{JSON.stringify(entry.metadata)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-5 flex items-center justify-between text-sm text-mist-400">
          {page > 1 ? (
            <Link href={`/admin/auditoria?pagina=${page - 1}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
            </Link>
          ) : (
            <span />
          )}
          <span>
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/admin/auditoria?pagina=${page + 1}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Próxima <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
