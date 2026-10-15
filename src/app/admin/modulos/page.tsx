import type { Metadata } from "next";
import { ModulesManager, type AdminModule } from "@/components/admin/modules-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { describeRequirementType, parseRequirement } from "@/lib/access/requirements";
import { requireAdmin } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Módulos" };

export default async function AdminModulesPage() {
  await requireAdmin();
  const db = getSupabaseAdmin();
  const { data: course } = await db.from("courses").select("id").eq("slug", getEnv().PRIMARY_COURSE_SLUG).maybeSingle();

  const { data: rows } = course
    ? await db
        .from("modules")
        .select("id, title, slug, description, topics, position, is_published, lessons(count), module_requirements(id, requirement_type, config_json, created_at)")
        .eq("course_id", course.id)
        .order("position")
    : { data: [] };

  const modules: AdminModule[] = (rows ?? []).map((row) => {
    const requirements = [...row.module_requirements]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((req) => {
        const parsed = parseRequirement(req);
        let summary = parsed.ok ? describeRequirementType(parsed.requirement.type) : `${req.requirement_type} (configuração inválida)`;
        if (parsed.ok && parsed.requirement.type === "BROKER_ELIGIBILITY") summary += ` [${parsed.requirement.config.requirement_key}]`;
        if (parsed.ok && parsed.requirement.type === "COMBINED") summary += ` (${parsed.requirement.config.operator})`;
        return { requirement_type: req.requirement_type, config_json: req.config_json, summary };
      });
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      topics: row.topics,
      position: row.position,
      is_published: row.is_published,
      lessonCount: row.lessons[0]?.count ?? 0,
      requirements,
    };
  });

  return (
    <>
      <AdminPageHeader
        title="Módulos"
        description="Crie, ordene e publique módulos. As regras de liberação são validadas no servidor a cada acesso do aluno."
      />
      <ModulesManager modules={modules} />
    </>
  );
}
