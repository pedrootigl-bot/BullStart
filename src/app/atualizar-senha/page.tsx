import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, FormAlert } from "@/components/auth/auth-shell";
import { UpdatePasswordForm } from "@/components/auth/forms";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Nova senha" };

export default async function UpdatePasswordPage() {
  const session = await getSessionUser();
  return (
    <AuthShell title="Definir nova senha" subtitle="Escolha uma senha forte que você não utilize em outros serviços.">
      {session ? (
        <UpdatePasswordForm />
      ) : (
        <div className="flex flex-col gap-4">
          <FormAlert tone="error">Este link expirou ou já foi utilizado.</FormAlert>
          <Link href="/recuperar-senha" className="text-sm font-medium text-brand-400 hover:text-brand-300">
            Solicitar um novo link
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
