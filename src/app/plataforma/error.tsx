"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function PlatformError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="size-6" />}
      title="Algo não saiu como esperado"
      description="Não foi possível carregar esta página agora. Seus dados estão preservados; tente novamente em instantes."
      action={<Button onClick={reset}>Tentar novamente</Button>}
    />
  );
}
