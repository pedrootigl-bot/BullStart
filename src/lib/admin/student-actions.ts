"use server";

import { revalidatePath } from "next/cache";
import { runAdmin, type AdminResult } from "@/lib/admin/guard";
import { grantAccessSchema, revokeAccessSchema, revokeCertificateSchema } from "@/lib/admin/schemas";
import { recordAudit } from "@/lib/audit";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function grantModuleAccessAction(input: unknown): Promise<AdminResult> {
  return runAdmin(grantAccessSchema, input, async (data, admin) => {
    const expiresAt = data.expiresAt ? new Date(`${data.expiresAt}T23:59:59-03:00`).toISOString() : null;
    if (expiresAt && new Date(expiresAt) <= new Date()) return { ok: false, error: "A data de expiração deve ser futura." };

    const db = getSupabaseAdmin();
    const [{ data: student }, { data: module }] = await Promise.all([
      db.from("profiles").select("id").eq("id", data.userId).maybeSingle(),
      db.from("modules").select("id, title").eq("id", data.moduleId).maybeSingle(),
    ]);
    if (!student || !module) return { ok: false, error: "Aluno ou módulo não encontrado." };

    const { error } = await db.from("module_access").upsert(
      {
        user_id: data.userId,
        module_id: data.moduleId,
        status: "granted",
        source: "MANUAL",
        reason: data.reason,
        granted_by: admin.profile.id,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "user_id,module_id" },
    );
    if (error) return { ok: false, error: "Não foi possível liberar o módulo." };

    await recordAudit({
      actorId: admin.profile.id,
      action: "module_access.granted",
      entityType: "profile",
      entityId: data.userId,
      metadata: { module_id: data.moduleId, module_title: module.title, reason: data.reason, expires_at: expiresAt },
    });
    revalidatePath(`/admin/alunos/${data.userId}`);
    return { ok: true, message: `Módulo "${module.title}" liberado.` };
  });
}

export async function revokeModuleAccessAction(input: unknown): Promise<AdminResult> {
  return runAdmin(revokeAccessSchema, input, async (data, admin) => {
    const db = getSupabaseAdmin();
    const { data: updated, error } = await db
      .from("module_access")
      .update({ status: "revoked", reason: data.reason, granted_by: admin.profile.id, verified_at: new Date().toISOString() })
      .eq("user_id", data.userId)
      .eq("module_id", data.moduleId)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, error: "Não foi possível revogar a liberação." };
    if (!updated) return { ok: false, error: "Não há liberação manual para este módulo." };

    await recordAudit({
      actorId: admin.profile.id,
      action: "module_access.revoked",
      entityType: "profile",
      entityId: data.userId,
      metadata: { module_id: data.moduleId, reason: data.reason },
    });
    revalidatePath(`/admin/alunos/${data.userId}`);
    return { ok: true, message: "Liberação manual revogada." };
  });
}

export async function revokeCertificateAction(input: unknown): Promise<AdminResult> {
  return runAdmin(revokeCertificateSchema, input, async (data, admin) => {
    const db = getSupabaseAdmin();
    const { data: certificate, error } = await db
      .from("certificates")
      .update({ revoked_at: new Date().toISOString(), revoked_reason: data.reason })
      .eq("id", data.certificateId)
      .is("revoked_at", null)
      .select("id, user_id, verification_code")
      .maybeSingle();
    if (error) return { ok: false, error: "Não foi possível revogar o certificado." };
    if (!certificate) return { ok: false, error: "Certificado não encontrado ou já revogado." };

    await recordAudit({
      actorId: admin.profile.id,
      action: "certificate.revoked",
      entityType: "certificate",
      entityId: certificate.id,
      metadata: { user_id: certificate.user_id, code: certificate.verification_code, reason: data.reason },
    });
    revalidatePath(`/admin/alunos/${certificate.user_id}`);
    return { ok: true, message: "Certificado revogado." };
  });
}
