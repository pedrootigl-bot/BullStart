"use client";

import { Award, Check, Copy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { issueCertificateAction } from "@/app/plataforma/certificado/actions";

export function IssueCertificateButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="gold"
      size="lg"
      disabled={pending}
      aria-busy={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await issueCertificateAction();
          if (result.ok) {
            toast.success("Certificado emitido! Parabéns pela conclusão.");
            router.refresh();
          } else {
            toast.error(result.error);
          }
        })
      }
    >
      {pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Award className="size-5" aria-hidden="true" />}
      Emitir meu certificado
    </Button>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copiado para a área de transferência.");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Não foi possível copiar.");
        }
      }}
    >
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {label}
    </Button>
  );
}
