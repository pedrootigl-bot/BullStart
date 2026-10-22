"use client";

import { useState, useSyncExternalStore } from "react";
import { ModuleCompleteModal } from "@/components/platform/module-complete-modal";
import {
  hasCelebratedModule,
  type CelebratableModule,
} from "@/lib/catalog/module-celebration";

const emptySubscribe = () => () => undefined;

/** Exibe a parabenização de módulos já concluídos (aulas + prova) ainda não celebrados neste navegador. */
export function ModuleCelebrationHost({ modules }: { modules: CelebratableModule[] }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const pending = mounted
    ? (modules.find((module) => !dismissedIds.includes(module.id) && !hasCelebratedModule(module.id)) ?? null)
    : null;

  if (!pending) return null;

  return (
    <ModuleCompleteModal
      moduleId={pending.id}
      moduleTitle={pending.title}
      onClose={() => setDismissedIds((ids) => [...ids, pending.id])}
    />
  );
}
