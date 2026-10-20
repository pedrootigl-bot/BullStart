import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

function withWelcome(path: string) {
  const url = new URL(path, "http://local.invalid");
  url.searchParams.set("boas-vindas", "1");
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Retorno dos links de e-mail do Supabase Auth (confirmação de cadastro e recuperação de senha). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Confirmação de cadastro (PKCE) — type pode vir na query do link.
      const destination = type === "signup" ? withWelcome(next) : next;
      return NextResponse.redirect(new URL(destination, origin));
    }
  } else if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      if (type === "recovery") return NextResponse.redirect(new URL("/atualizar-senha", origin));
      const destination = type === "signup" ? withWelcome(next) : next;
      return NextResponse.redirect(new URL(destination, origin));
    }
  }

  return NextResponse.redirect(new URL("/login?erro=link-invalido", origin));
}
