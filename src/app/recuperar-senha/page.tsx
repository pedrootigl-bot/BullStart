import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetRequestForm } from "@/components/auth/forms";

export const metadata: Metadata = { title: "Recuperar acesso" };

export default function RecoverPasswordPage() {
  return (
    <AuthShell
      title="Recuperar acesso"
      subtitle="Informe o e-mail da sua conta. Enviaremos um link seguro para você criar uma nova senha."
      footer={
        <Link href="/login" className="font-medium text-brand-400 hover:text-brand-300">
          Voltar para o login
        </Link>
      }
    >
      <ResetRequestForm />
    </AuthShell>
  );
}
