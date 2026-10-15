"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getActiveCertificate } from "@/lib/certificates/service";
import { getEnv } from "@/lib/env";
import { consumeRateLimit } from "@/lib/http/security";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({ fullName: z.string().trim().min(3, "Informe seu nome completo.").max(120) });

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

/** Único campo editável pelo aluno: o nome. Vínculo, papel e dados da corretora nunca vêm do navegador. */
export async function updateProfileNameAction(input: unknown): Promise<ProfileActionResult> {
  const session = await getSessionUser();
  if (!session) return { ok: false, error: "Sessão expirada." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Nome inválido." };

  if (!(await consumeRateLimit(`profile:${session.profile.id}`, 10, 3600))) {
    return { ok: false, error: "Muitas alterações recentes. Tente mais tarde." };
  }

  const db = getSupabaseAdmin();
  const { data: course } = await db.from("courses").select("id").eq("slug", getEnv().PRIMARY_COURSE_SLUG).maybeSingle();
  if (course && (await getActiveCertificate(session.profile.id, course.id))) {
    return { ok: false, error: "Seu certificado já foi emitido. Para corrigir o nome, fale com o suporte." };
  }

  const { error } = await db.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", session.profile.id);
  if (error) return { ok: false, error: "Não foi possível salvar agora." };

  revalidatePath("/plataforma", "layout");
  return { ok: true };
}
