"use client";

import { Loader2, Unlock } from "lucide-react";
import { useState } from "react";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { grantModuleAccessAction, revokeCertificateAction, revokeModuleAccessAction } from "@/lib/admin/student-actions";

export function GrantAccessForm({ userId, modules }: { userId: string; modules: { id: string; title: string; position: number }[] }) {
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const { pending, run } = useAdminAction();

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() => grantModuleAccessAction({ userId, moduleId, reason, expiresAt }), {
          onSuccess: () => {
            setReason("");
            setExpiresAt("");
          },
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Módulo" htmlFor="grant-module">
          <Select id="grant-module" value={moduleId} onChange={(e) => setModuleId(e.target.value)} required>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.position}. {m.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Expira em (opcional)" htmlFor="grant-expires">
          <Input id="grant-expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
      </div>
      <Field label="Motivo (registrado na auditoria)" htmlFor="grant-reason">
        <Textarea id="grant-reason" required minLength={5} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div>
        <Button type="submit" disabled={pending || !moduleId}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Unlock className="size-4" aria-hidden="true" />}
          Liberar módulo
        </Button>
      </div>
    </form>
  );
}

function ReasonDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string, done: () => void) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(reason, () => {
            setReason("");
            onClose();
          });
        }}
      >
        <Field label="Motivo (registrado na auditoria)" htmlFor="revoke-reason">
          <Textarea id="revoke-reason" required minLength={5} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="danger">
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function RevokeAccessButton({ userId, moduleId, moduleTitle }: { userId: string; moduleId: string; moduleTitle: string }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAdminAction();
  return (
    <>
      <Button variant="danger" size="sm" disabled={pending} onClick={() => setOpen(true)}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Revogar
      </Button>
      <ReasonDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Revogar liberação manual"
        description={moduleTitle}
        confirmLabel="Revogar liberação"
        onConfirm={(reason, done) => run(() => revokeModuleAccessAction({ userId, moduleId, reason }), { onSuccess: done })}
      />
    </>
  );
}

export function RevokeCertificateButton({ certificateId, code }: { certificateId: string; code: string }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useAdminAction();
  return (
    <>
      <Button variant="danger" size="sm" disabled={pending} onClick={() => setOpen(true)}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Revogar certificado
      </Button>
      <ReasonDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Revogar certificado"
        description={`Código ${code}. A verificação pública passará a indicar “revogado”.`}
        confirmLabel="Revogar certificado"
        onConfirm={(reason, done) => run(() => revokeCertificateAction({ certificateId, reason }), { onSuccess: done })}
      />
    </>
  );
}
