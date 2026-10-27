import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/forms";
import { safeNextPath } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, string> = {
  sessao: "Sua sessão expirou. Entre novamente para continuar.",
  "link-invalido": "O link utilizado é inválido ou expirou. Solicite um novo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const notice = typeof params.erro === "string" ? NOTICES[params.erro] : undefined;

  return (
    <AuthShell
      title="Acesse sua formação"
      subtitle="Entre com o e-mail e a senha da sua conta Bull Academy."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-brand-400 hover:text-brand-300">
            Criar conta gratuita
          </Link>
        </>
      }
    >
      <LoginForm next={next} notice={notice} />
    </AuthShell>
  );
}
