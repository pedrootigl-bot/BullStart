import { SearchX } from "lucide-react";
import { PublicShell } from "@/components/public-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function NotFound() {
  return (
    <PublicShell>
      <EmptyState
        icon={<SearchX className="size-6" />}
        title="Página não encontrada"
        description="O endereço acessado não existe ou foi movido."
        action={<ButtonLink href="/">Ir para o início</ButtonLink>}
      />
    </PublicShell>
  );
}
