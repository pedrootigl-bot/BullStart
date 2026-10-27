import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Comece sua formação"
      subtitle="Crie sua conta Bull Academy. O primeiro módulo é liberado assim que você entra."
      footer={
        <>
          Já possui conta?{" "}
          <Link href="/login" className="font-medium text-brand-400 hover:text-brand-300">
            Entrar
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
