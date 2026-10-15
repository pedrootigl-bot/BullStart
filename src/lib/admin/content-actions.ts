"use server";

import { revalidatePath } from "next/cache";
import { validateRequirementInput } from "@/lib/access/requirements";
import { isUniqueViolation, runAdmin, type AdminResult } from "@/lib/admin/guard";
import {
  attachVideoSchema,
  courseSettingsSchema,
  idSchema,
  lessonInputSchema,
  moduleInputSchema,
  moduleRequirementsSchema,
  moveSchema,
  publishSchema,
  videoUploadSchema,
} from "@/lib/admin/schemas";
import { recordAudit } from "@/lib/audit";
import { getEnv } from "@/lib/env";
import { slugify } from "@/lib/format";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSafeImageUrl, isSafeStoragePath, validateExternalVideoUrl } from "@/lib/video/external";
import { toPublicSupabaseUrl, VIDEO_BUCKET } from "@/lib/video/playback";

function revalidateContent() {
  revalidatePath("/admin", "layout");
  revalidatePath("/plataforma", "layout");
  revalidatePath("/");
}

// ---------------------------------------------------------------------------
// Curso
// ---------------------------------------------------------------------------

export async function updateCourseSettingsAction(input: unknown): Promise<AdminResult> {
  return runAdmin(courseSettingsSchema, input, async (data, admin) => {
    const db = getSupabaseAdmin();
    const { error } = await db
      .from("courses")
      .update({ workload_hours: data.workloadHours, completion_min_watch_ratio: data.minWatchPercent / 100 })
      .eq("id", data.courseId);
    if (error) return { ok: false, error: "Não foi possível salvar as configurações." };
    await recordAudit({
      actorId: admin.profile.id,
      action: "course.settings_updated",
      entityType: "course",
      entityId: data.courseId,
      metadata: { workload_hours: data.workloadHours, min_watch_percent: data.minWatchPercent },
    });
    revalidateContent();
    return { ok: true, message: "Configurações salvas." };
  });
}

// ---------------------------------------------------------------------------
// Módulos
// ---------------------------------------------------------------------------

export async function saveModuleAction(input: unknown): Promise<AdminResult<{ id: string }>> {
  return runAdmin(moduleInputSchema, input, async (data, admin) => {
    const db = getSupabaseAdmin();
    const slug = data.slug || slugify(data.title);
    if (!slug) return { ok: false, error: "Não foi possível gerar um slug válido a partir do título." };
    const fields = { title: data.title, slug, description: data.description, topics: data.topics, is_published: data.isPublished };

    if (data.id) {
      const { error } = await db.from("modules").update(fields).eq("id", data.id);
      if (isUniqueViolation(error)) return { ok: false, error: "Já existe um módulo com este slug." };
      if (error) return { ok: false, error: "Não foi possível salvar o módulo." };
      await recordAudit({ actorId: admin.profile.id, action: "module.updated", entityType: "module", entityId: data.id, metadata: fields });
      revalidateContent();
      return { ok: true, message: "Módulo atualizado.", data: { id: data.id } };
    }

    const { data: course } = await db.from("courses").select("id").eq("slug", getEnv().PRIMARY_COURSE_SLUG).maybeSingle();
    if (!course) return { ok: false, error: "Curso principal não encontrado." };
    const { data: last } = await db
      .from("modules")
      .select("position")
      .eq("course_id", course.id)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: created, error } = await db
      .from("modules")
      .insert({ ...fields, course_id: course.id, position: (last?.position ?? 0) + 1 })
      .select("id")
      .single();
    if (isUniqueViolation(error)) return { ok: false, error: "Já existe um módulo com este slug." };
    if (error || !created) return { ok: false, error: "Não foi possível criar o módulo." };

    // Fail-closed: todo módulo nasce exigindo o anterior; o admin ajusta as regras depois.
    await db.from("module_requirements").insert({
      module_id: created.id,
      requirement_type: "PREVIOUS_MODULE",
      config_json: { version: 1, min_completion_percent: 100 },
    });
    await recordAudit({ actorId: admin.profile.id, action: "module.created", entityType: "module", entityId: created.id, metadata: fields });
    revalidateContent();
    return { ok: true, message: "Módulo criado.", data: { id: created.id } };
  });
}

export async function moveModuleAction(input: unknown): Promise<AdminResult> {
  return runAdmin(moveSchema, input, async (data, admin) => {
    const { data: moved, error } = await getSupabaseAdmin().rpc("move_module", { p_module_id: data.id, p_direction: data.direction });
    if (error) return { ok: false, error: "Não foi possível reordenar." };
    if (!moved) return { ok: true, message: "O módulo já está no limite da lista." };
    await recordAudit({ actorId: admin.profile.id, action: "module.moved", entityType: "module", entityId: data.id, metadata: { direction: data.direction } });
    revalidateContent();
    return { ok: true };
  });
}

export async function setModulePublishedAction(input: unknown): Promise<AdminResult> {
  return runAdmin(publishSchema, input, async (data, admin) => {
    const { error } = await getSupabaseAdmin().from("modules").update({ is_published: data.published }).eq("id", data.id);
    if (error) return { ok: false, error: "Não foi possível alterar a publicação." };
    await recordAudit({
      actorId: admin.profile.id,
      action: data.published ? "module.published" : "module.unpublished",
      entityType: "module",
      entityId: data.id,
    });
    revalidateContent();
    return { ok: true, message: data.published ? "Módulo publicado." : "Módulo despublicado." };
  });
}

export async function deleteModuleAction(input: unknown): Promise<AdminResult> {
  return runAdmin(idSchema, input, async (data, admin) => {
    const db = getSupabaseAdmin();
    const { count } = await db.from("lessons").select("id", { count: "exact", head: true }).eq("module_id", data.id);
    if ((count ?? 0) > 0) return { ok: false, error: "Remova ou mova as aulas deste módulo antes de excluí-lo." };
    const { data: removed, error } = await db.from("modules").delete().eq("id", data.id).select("title").maybeSingle();
    if (error) return { ok: false, error: "Não foi possível excluir o módulo." };
    await recordAudit({ actorId: admin.profile.id, action: "module.deleted", entityType: "module", entityId: data.id, metadata: { title: removed?.title ?? null } });
    revalidateContent();
    return { ok: true, message: "Módulo excluído." };
  });
}

export async function saveModuleRequirementsAction(input: unknown): Promise<AdminResult> {
  return runAdmin(moduleRequirementsSchema, input, async (data, admin) => {
    const rows = [];
    for (const [index, rule] of data.rules.entries()) {
      const parsed = validateRequirementInput({ type: rule.type, config: rule.config });
      if (!parsed.ok) return { ok: false, error: `Regra ${index + 1} inválida. Revise os campos.` };
      rows.push({ module_id: data.moduleId, requirement_type: parsed.requirement.type, config_json: parsed.requirement.config as Json & object });
    }

    const db = getSupabaseAdmin();
    const { data: existing } = await db.from("module_requirements").select("id").eq("module_id", data.moduleId);

    // Insere as novas regras antes de remover as antigas: se algo falhar no meio,
    // o módulo fica mais restrito (regras somadas com AND), nunca liberado por engano.
    if (rows.length) {
      const { error } = await db.from("module_requirements").insert(rows);
      if (error) return { ok: false, error: "Não foi possível salvar as regras." };
    }
    const oldIds = (existing ?? []).map((row) => row.id);
    if (oldIds.length) {
      const { error } = await db.from("module_requirements").delete().in("id", oldIds);
      if (error) return { ok: false, error: "Regras novas salvas, mas as antigas não foram removidas. Tente novamente." };
    }

    await recordAudit({
      actorId: admin.profile.id,
      action: "module.requirements_updated",
      entityType: "module",
      entityId: data.moduleId,
      metadata: { rules: rows.map((r) => ({ type: r.requirement_type, config: r.config_json })) },
    });
    revalidateContent();
    return {
      ok: true,
      message: rows.length ? "Regras de liberação salvas." : "Regras removidas: o módulo ficará bloqueado para todos os alunos.",
    };
  });
}

// ---------------------------------------------------------------------------
// Aulas
// ---------------------------------------------------------------------------

export async function saveLessonAction(input: unknown): Promise<AdminResult<{ id: string }>> {
  return runAdmin(lessonInputSchema, input, async (data, admin) => {
    const env = getEnv();
    const thumbnail = data.thumbnailUrl || null;
    if (thumbnail && !isSafeImageUrl(thumbnail)) return { ok: false, error: "Miniatura deve ser uma URL https ou um caminho local." };

    let videoAssetId: string | null = data.videoAssetId || null;
    if (videoAssetId) {
      if (data.videoProvider === "supabase_storage" && !isSafeStoragePath(videoAssetId)) {
        return { ok: false, error: "Caminho do vídeo no Storage inválido." };
      }
      if (data.videoProvider === "external_url") {
        videoAssetId = validateExternalVideoUrl(videoAssetId, env.VIDEO_EXTERNAL_ALLOWED_HOSTS);
        if (!videoAssetId) {
          return { ok: false, error: "URL externa inválida: use https em um host autorizado (VIDEO_EXTERNAL_ALLOWED_HOSTS)." };
        }
      }
    }
    if (data.isPublished && !videoAssetId) return { ok: false, error: "Associe um vídeo antes de publicar a aula." };

    const fields = {
      title: data.title,
      description: data.description,
      objectives: data.objectives,
      topics: data.topics,
      materials: data.materials,
      thumbnail_url: thumbnail,
      video_provider: data.videoProvider,
      video_asset_id: videoAssetId,
      duration_seconds: data.durationSeconds,
      is_required: data.isRequired,
      is_published: data.isPublished,
    };
    const db = getSupabaseAdmin();

    const nextPosition = async (moduleId: string) => {
      const { data: last } = await db
        .from("lessons")
        .select("position")
        .eq("module_id", moduleId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (last?.position ?? 0) + 1;
    };

    if (data.id) {
      const { data: current } = await db.from("lessons").select("module_id").eq("id", data.id).maybeSingle();
      if (!current) return { ok: false, error: "Aula não encontrada." };
      const moving = current.module_id !== data.moduleId;
      const { error } = await db
        .from("lessons")
        .update(moving ? { ...fields, module_id: data.moduleId, position: await nextPosition(data.moduleId) } : fields)
        .eq("id", data.id);
      if (error) return { ok: false, error: "Não foi possível salvar a aula." };
      await recordAudit({
        actorId: admin.profile.id,
        action: "lesson.updated",
        entityType: "lesson",
        entityId: data.id,
        metadata: { ...fields, materials: data.materials.length, module_id: data.moduleId },
      });
      revalidateContent();
      return { ok: true, message: "Aula atualizada.", data: { id: data.id } };
    }

    const { data: created, error } = await db
      .from("lessons")
      .insert({ ...fields, module_id: data.moduleId, position: await nextPosition(data.moduleId) })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "Não foi possível criar a aula." };
    await recordAudit({
      actorId: admin.profile.id,
      action: "lesson.created",
      entityType: "lesson",
      entityId: created.id,
      metadata: { title: data.title, module_id: data.moduleId },
    });
    revalidateContent();
    return { ok: true, message: "Aula criada.", data: { id: created.id } };
  });
}

export async function moveLessonAction(input: unknown): Promise<AdminResult> {
  return runAdmin(moveSchema, input, async (data, admin) => {
    const { data: moved, error } = await getSupabaseAdmin().rpc("move_lesson", { p_lesson_id: data.id, p_direction: data.direction });
    if (error) return { ok: false, error: "Não foi possível reordenar." };
    if (!moved) return { ok: true, message: "A aula já está no limite do módulo." };
    await recordAudit({ actorId: admin.profile.id, action: "lesson.moved", entityType: "lesson", entityId: data.id, metadata: { direction: data.direction } });
    revalidateContent();
    return { ok: true };
  });
}

export async function setLessonPublishedAction(input: unknown): Promise<AdminResult> {
  return runAdmin(publishSchema, input, async (data, admin) => {
    const db = getSupabaseAdmin();
    if (data.published) {
      const { data: lesson } = await db.from("lessons").select("video_asset_id").eq("id", data.id).maybeSingle();
      if (!lesson?.video_asset_id) return { ok: false, error: "Associe um vídeo antes de publicar a aula." };
    }
    const { error } = await db.from("lessons").update({ is_published: data.published }).eq("id", data.id);
    if (error) return { ok: false, error: "Não foi possível alterar a publicação." };
    await recordAudit({
      actorId: admin.profile.id,
      action: data.published ? "lesson.published" : "lesson.unpublished",
      entityType: "lesson",
      entityId: data.id,
    });
    revalidateContent();
    return { ok: true, message: data.published ? "Aula publicada." : "Aula despublicada." };
  });
}

export async function deleteLessonAction(input: unknown): Promise<AdminResult> {
  return runAdmin(idSchema, input, async (data, admin) => {
    const db = getSupabaseAdmin();
    const { count } = await db.from("lesson_progress").select("id", { count: "exact", head: true }).eq("lesson_id", data.id);
    if ((count ?? 0) > 0) {
      return { ok: false, error: "Esta aula já possui progresso de alunos. Despublique-a em vez de excluir." };
    }
    const { data: removed, error } = await db.from("lessons").delete().eq("id", data.id).select("title").maybeSingle();
    if (error) return { ok: false, error: "Não foi possível excluir a aula." };
    await recordAudit({ actorId: admin.profile.id, action: "lesson.deleted", entityType: "lesson", entityId: data.id, metadata: { title: removed?.title ?? null } });
    revalidateContent();
    return { ok: true, message: "Aula excluída." };
  });
}

/** Gera uma URL de upload assinada e de uso único para o bucket privado de vídeos. */
export async function createVideoUploadAction(input: unknown): Promise<AdminResult<{ uploadUrl: string; path: string }>> {
  return runAdmin(videoUploadSchema, input, async (data) => {
    const env = getEnv();
    const extension = data.contentType === "video/webm" ? "webm" : "mp4";
    const base = slugify(data.fileName.replace(/\.[^.]+$/, "")).slice(0, 60) || "video";
    const path = `lessons/${data.lessonId}/${Date.now()}-${base}.${extension}`;
    const { data: signed, error } = await getSupabaseAdmin().storage.from(VIDEO_BUCKET).createSignedUploadUrl(path);
    if (error || !signed) return { ok: false, error: "Não foi possível preparar o upload." };
    return {
      ok: true,
      data: { uploadUrl: toPublicSupabaseUrl(signed.signedUrl, env.SUPABASE_URL, env.SUPABASE_PUBLIC_URL), path },
    };
  });
}

export async function attachUploadedVideoAction(input: unknown): Promise<AdminResult> {
  return runAdmin(attachVideoSchema, input, async (data, admin) => {
    if (!isSafeStoragePath(data.path) || !data.path.startsWith(`lessons/${data.lessonId}/`)) {
      return { ok: false, error: "Caminho de upload inválido." };
    }
    const db = getSupabaseAdmin();
    const { error: existsError } = await db.storage.from(VIDEO_BUCKET).createSignedUrl(data.path, 30);
    if (existsError) return { ok: false, error: "O arquivo não foi encontrado no armazenamento. Refaça o upload." };

    const fields: { video_provider: "supabase_storage"; video_asset_id: string; duration_seconds?: number } = {
      video_provider: "supabase_storage",
      video_asset_id: data.path,
    };
    if (data.durationSeconds > 0) fields.duration_seconds = data.durationSeconds;
    const { error } = await db.from("lessons").update(fields).eq("id", data.lessonId);
    if (error) return { ok: false, error: "Não foi possível associar o vídeo à aula." };
    await recordAudit({ actorId: admin.profile.id, action: "lesson.video_uploaded", entityType: "lesson", entityId: data.lessonId, metadata: fields });
    revalidateContent();
    return { ok: true, message: "Vídeo enviado e associado à aula." };
  });
}
