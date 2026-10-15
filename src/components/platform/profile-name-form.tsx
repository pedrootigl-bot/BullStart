"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { updateProfileNameAction } from "@/app/plataforma/perfil/actions";

export function ProfileNameForm({ initialName, locked }: { initialName: string; locked: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        setError(undefined);
        startTransition(async () => {
          const result = await updateProfileNameAction({ fullName: name });
          if (result.ok) {
            toast.success("Nome atualizado.");
            router.refresh();
          } else {
            setError(result.error);
          }
        });
      }}
    >
      <Field
        label="Nome completo (impresso no certificado)"
        htmlFor="fullName"
        className="flex-1"
        error={error}
        hint={locked ? "Certificado já emitido: alterações exigem contato com o suporte." : undefined}
      >
        <Input id="fullName" value={name} onChange={(e) => setName(e.target.value)} disabled={locked} maxLength={120} autoComplete="name" />
      </Field>
      <Button type="submit" disabled={pending || locked || name.trim() === initialName.trim()}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Salvar
      </Button>
    </form>
  );
}
