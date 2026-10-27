import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/public-shell";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { normalizeVerificationCode } from "@/lib/certificates/code";

export const metadata: Metadata = { title: "Verificar certificado" };

async function verifyAction(formData: FormData) {
  "use server";
  const code = normalizeVerificationCode(String(formData.get("code") ?? ""));
  redirect(code ? `/certificado/verificar/${code}` : "/certificado/verificar?invalido=1");
}

export default async function VerifyLandingPage({ searchParams }: PageProps<"/certificado/verificar">) {
  const params = await searchParams;
  return (
    <PublicShell>
      <div className="flex flex-col gap-8">
        <header>
          <ShieldCheck className="size-10 text-brand-400" aria-hidden="true" />
          <h1 className="mt-4 text-3xl font-semibold text-mist-50">Verificar certificado</h1>
          <p className="mt-2 text-mist-400">Informe o código de validação impresso no certificado Bull Academy.</p>
        </header>
        <form action={verifyAction} className="surface flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
          <Field
            label="Código de validação"
            htmlFor="code"
            className="flex-1"
            error={params.invalido ? "Código em formato inválido. Exemplo: BXS-7K2M-Q9TR-4HXA" : undefined}
          >
            <Input id="code" name="code" required placeholder="BXS-XXXX-XXXX-XXXX" autoComplete="off" className="font-mono uppercase" />
          </Field>
          <Button type="submit">Verificar</Button>
        </form>
      </div>
    </PublicShell>
  );
}
