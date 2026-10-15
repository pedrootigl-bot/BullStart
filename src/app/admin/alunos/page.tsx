import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/progress";
import { requireAdmin } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Alunos" };

const PAGE_SIZE = 20;

export default async function AdminStudentsPage({ searchParams }: PageProps<"/admin/alunos">) {
  await requireAdmin();
  const params = await searchParams;
  const rawQuery = typeof params.q === "string" ? params.q : "";
  // Remove caracteres com significado na sintaxe de filtros do PostgREST.
  const query = rawQuery.replace(/[%,()*\\:"']/g, " ").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(typeof params.pagina === "string" ? params.pagina : "1", 10) || 1);

  const db = getSupabaseAdmin();
  let request = db
    .from("profiles")
    .select("id, full_name, email, role, broker_user_id, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (query) request = request.or(`full_name.ilike.%${query}%,email.ilike.%${query}%,broker_user_id.ilike.%${query}%`);
  const { data: profiles, count } = await request;

  const { data: course } = await db.from("courses").select("id").eq("slug", getEnv().PRIMARY_COURSE_SLUG).maybeSingle();
  const { data: requiredLessons } = course
    ? await db.from("lessons").select("id, modules!inner(course_id, is_published)").eq("is_published", true).eq("is_required", true).eq("modules.course_id", course.id).eq("modules.is_published", true)
    : { data: [] };
  const requiredIds = new Set((requiredLessons ?? []).map((l) => l.id));

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: completed } = ids.length
    ? await db.from("lesson_progress").select("user_id, lesson_id").in("user_id", ids).eq("status", "completed")
    : { data: [] };
  const completedByUser = new Map<string, number>();
  for (const row of completed ?? []) {
    if (requiredIds.has(row.lesson_id)) completedByUser.set(row.user_id, (completedByUser.get(row.user_id) ?? 0) + 1);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const pageHref = (target: number) => `/admin/alunos?${new URLSearchParams({ ...(query ? { q: query } : {}), pagina: String(target) })}`;

  return (
    <>
      <AdminPageHeader title="Alunos" description={`${count ?? 0} conta(s) cadastrada(s).`} />

      <form role="search" className="mb-6 flex gap-2" action="/admin/alunos">
        <label htmlFor="q" className="sr-only">
          Buscar por nome, e-mail ou ID da corretora
        </label>
        <Input id="q" name="q" defaultValue={query} placeholder="Buscar por nome, e-mail ou ID da corretora" className="max-w-md" />
        <Button type="submit" variant="secondary">
          <Search className="size-4" aria-hidden="true" /> Buscar
        </Button>
      </form>

      {!profiles?.length ? (
        <EmptyState icon={<Users className="size-6" />} title="Nenhum aluno encontrado" description={query ? "Tente outro termo de busca." : "Ainda não há cadastros."} />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-white/[0.06] text-xs tracking-wide text-mist-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">Aluno</th>
                <th scope="col" className="px-5 py-3 font-medium">Corretora</th>
                <th scope="col" className="px-5 py-3 font-medium">Progresso</th>
                <th scope="col" className="px-5 py-3 font-medium">Cadastro</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {profiles.map((profile) => {
                const done = completedByUser.get(profile.id) ?? 0;
                const percent = requiredIds.size ? Math.floor((done / requiredIds.size) * 100) : 0;
                return (
                  <tr key={profile.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5">
                      <p className="flex items-center gap-2 font-medium text-mist-50">
                        {profile.full_name || "—"} {profile.role === "admin" && <Badge tone="gold">Admin</Badge>}
                      </p>
                      <p className="text-xs text-mist-500">{profile.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {profile.broker_user_id ? <Badge tone="brand">Vinculado</Badge> : <Badge>Sem vínculo</Badge>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <ProgressBar value={percent} label={`Progresso de ${profile.full_name}`} size="sm" />
                        <span className="w-10 text-xs text-mist-400">{percent}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-mist-400">{formatDate(profile.created_at)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Link href={`/admin/alunos/${profile.id}`} className={buttonClasses({ variant: "ghost", size: "sm" })}>
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Paginação" className="mt-5 flex items-center justify-between text-sm text-mist-400">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              <ChevronLeft className="size-4" aria-hidden="true" /> Anterior
            </Link>
          ) : (
            <span />
          )}
          <span>
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className={buttonClasses({ variant: "secondary", size: "sm" })}>
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
