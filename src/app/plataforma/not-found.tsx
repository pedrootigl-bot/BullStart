import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function PlatformNotFound() {
  return (
    <EmptyState
      icon={<SearchX className="size-6" />}
      title="Conteúdo não encontrado"
      description="O módulo ou a aula que você procura não existe ou não está publicado."
      action={<ButtonLink href="/plataforma">Voltar para a formação</ButtonLink>}
    />
  );
}
