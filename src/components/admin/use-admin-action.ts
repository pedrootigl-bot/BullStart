"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

type Result<T> = { ok: true; message?: string; data?: T } | { ok: false; error: string };

/** Executa uma Server Action administrativa com feedback (toast) e atualização da página. */
export function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run<T>(action: () => Promise<Result<T>>, options: { onSuccess?: (data: T | undefined) => void; refresh?: boolean } = {}) {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        if (result.message) toast.success(result.message);
        options.onSuccess?.(result.data);
        if (options.refresh !== false) router.refresh();
      } catch {
        toast.error("Falha de comunicação com o servidor. Tente novamente.");
      }
    });
  }

  return { pending, run };
}
