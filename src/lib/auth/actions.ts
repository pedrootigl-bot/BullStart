"use server";

import { redirect } from "next/navigation";
import {
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  type ActionResult,
} from "@/lib/auth/schemas";
import { safeNextPath } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { clientIp, consumeRateLimit } from "@/lib/http/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const TOO_MANY = "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Verifique o e-mail e a senha informados." };
  const { email, password, next } = parsed.data;

  const ip = await clientIp();
  const allowed =
    (await consumeRateLimit(`login:ip:${ip}`, 20, 600)) && (await consumeRateLimit(`login:email:${email}`, 8, 600));
  if (!allowed) return { ok: false, error: TOO_MANY };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "Confirme seu e-mail pelo link enviado antes de entrar." };
    }
    return { ok: false, error: "E-mail ou senha inválidos." };
  }

  redirect(safeNextPath(next));
}

export async function signUpAction(input: unknown): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const { email, password, fullName } = parsed.data;

  const ip = await clientIp();
  if (!(await consumeRateLimit(`signup:ip:${ip}`, 6, 3600))) return { ok: false, error: TOO_MANY };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: new URL("/auth/callback?next=/plataforma", getEnv().APP_URL).toString(),
    },
  });

  if (error) {
    if (error.code === "weak_password") return { ok: false, error: "Escolha uma senha mais forte." };
    return {
      ok: false,
      error: "Não foi possível concluir o cadastro. Se você já possui conta, entre ou recupere sua senha.",
    };
  }

  if (data.session) redirect("/plataforma?boas-vindas=1");
  return { ok: true, message: "Enviamos um link de confirmação para o seu e-mail. Confirme para acessar a plataforma." };
}

export async function requestPasswordResetAction(input: unknown): Promise<ActionResult> {
  const parsed = resetRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Informe um e-mail válido." };

  const ip = await clientIp();
  const allowed =
    (await consumeRateLimit(`reset:ip:${ip}`, 10, 3600)) &&
    (await consumeRateLimit(`reset:email:${parsed.data.email}`, 3, 3600));
  if (!allowed) return { ok: false, error: TOO_MANY };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: new URL("/auth/callback?next=/atualizar-senha", getEnv().APP_URL).toString(),
  });
  if (error) console.error("[auth] falha ao solicitar recuperação", error.code);

  return {
    ok: true,
    message: "Se houver uma conta com este e-mail, você receberá um link para redefinir a senha em instantes.",
  };
}

export async function updatePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Senha inválida." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Seu link expirou. Solicite uma nova recuperação de senha." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "A nova senha deve ser diferente da atual." };
    return { ok: false, error: "Não foi possível atualizar a senha. Tente novamente." };
  }
  redirect("/plataforma?senha=atualizada");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
