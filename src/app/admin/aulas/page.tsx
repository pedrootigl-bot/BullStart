import { Layers } from "lucide-react";
import type { Metadata } from "next";
import { LessonsManager, type AdminLesson } from "@/components/admin/lessons-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { requireAdmin } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Aulas" };

function toMaterials(value: unknown): AdminLesson["materials"] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) =>
    item && typeof item === "object" && "title" in item && "url" in item && typeof item.title === "string" && typeof item.url === "string"
      ? [{ title: item.title, url: item.url }]
      : [],
  );
}

export default async function AdminLessonsPage({ searchParams }: PageProps<"/admin/aulas">) {
  await requireAdmin();
  const { modulo } = await searchParams;
  const db = getSupabaseAdmin();
  const { data: course } = await db.from("courses").select("id").eq("slug", getEnv().PRIMARY_COURSE_SLUG).maybeSingle();
  const { data: modules } = course
    ? await db.from("modules").select("id, title, position").eq("course_id", course.id).order("position")
    : { data: [] };

  const moduleOptions = modules ?? [];
  if (moduleOptions.length === 0) {
    return (
      <>
        <AdminPageHeader title="Aulas" />
        <EmptyState
          icon={<Layers className="size-6" />}
          title="Crie um módulo primeiro"
          description="Aulas pertencem a módulos."
          action={<ButtonLink href="/admin/modulos">Ir para módulos</ButtonLink>}
        />
      </>
    );
  }

  const selected = moduleOptions.find((m) => m.id === modulo) ?? moduleOptions[0]!;
  const { data: rows } = await db
    .from("lessons")
    .select(
      "id, module_id, title, description, objectives, topics, materials, thumbnail_url, video_provider, video_asset_id, duration_seconds, position, is_required, is_published",
    )
    .eq("module_id", selected.id)
    .order("position");

  const lessons: AdminLesson[] = (rows ?? []).map((row) => ({ ...row, materials: toMaterials(row.materials) }));

  return (
    <>
      <AdminPageHeader
        title="Aulas"
        description="Gerencie conteúdo, vídeo e publicação. Vídeos ficam em bucket privado e só são entregues por URL temporária a alunos autorizados."
      />
      <LessonsManager lessons={lessons} modules={moduleOptions} selectedModuleId={selected.id} />
    </>
  );
}
