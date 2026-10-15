import { CheckCircle2, CircleDashed, CircleDot, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LessonStatus } from "@/lib/access/snapshot";

export function LessonStatusBadge({ status }: { status: LessonStatus }) {
  switch (status) {
    case "completed":
      return (
        <Badge tone="brand">
          <CheckCircle2 className="size-3.5" aria-hidden="true" /> Concluída
        </Badge>
      );
    case "in_progress":
      return (
        <Badge tone="gold">
          <CircleDot className="size-3.5" aria-hidden="true" /> Em andamento
        </Badge>
      );
    case "available":
      return (
        <Badge tone="neutral">
          <CircleDashed className="size-3.5" aria-hidden="true" /> Disponível
        </Badge>
      );
    case "locked":
      return (
        <Badge tone="neutral" className="text-mist-500">
          <Lock className="size-3.5" aria-hidden="true" /> Bloqueada
        </Badge>
      );
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}
