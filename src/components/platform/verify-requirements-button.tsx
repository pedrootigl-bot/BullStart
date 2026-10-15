"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type RefreshResponse =
  | { ok: true; results: { key: string; status: string }[] }
  | { ok: false; error: { code: string; message: string } };

const STATUS_MESSAGES: Record<string, string> = {
  eligible: "Requisito confirmado pela corretora.",
  not_eligible: "A corretora informou que o requisito ainda não foi atendido.",
  pending: "Aguardando confirmação da corretora.",
  unavailable: "A verificação está temporariamente indisponível. Tente novamente mais tarde.",
};

export function VerifyRequirementsButton({
  moduleId,
  variant = "outline",
  label = "Verificar requisitos",
}: {
  moduleId: string;
  variant?: "outline" | "secondary" | "primary";
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const verify = () =>
    startTransition(async () => {
      try {
        const response = await fetch("/api/eligibility/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId }),
        });
        const body = (await response.json()) as RefreshResponse;
        if (!body.ok) {
          toast.error(body.error.message);
          return;
        }
        const statuses = body.results.map((r) => r.status);
        const status =
          statuses.length === 0 || statuses.includes("unavailable")
            ? "unavailable"
            : statuses.every((s) => s === "eligible")
              ? "eligible"
              : statuses.includes("not_eligible")
                ? "not_eligible"
                : "pending";
        if (status === "eligible") toast.success(STATUS_MESSAGES.eligible);
        else toast.info(STATUS_MESSAGES[status] ?? STATUS_MESSAGES.unavailable);
        router.refresh();
      } catch {
        toast.error("Não foi possível verificar agora. Verifique sua conexão.");
      }
    });

  return (
    <Button variant={variant} size="sm" onClick={verify} disabled={pending} aria-busy={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-4" aria-hidden="true" />}
      {pending ? "Verificando..." : label}
    </Button>
  );
}
