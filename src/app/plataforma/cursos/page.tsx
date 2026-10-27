import type { Metadata } from "next";
import { FormationsCatalog } from "@/components/platform/formations-catalog";
import { getStudentContext } from "@/lib/access/student";
import { filterLaunchModules } from "@/lib/catalog/launch";

export const metadata: Metadata = { title: "Formações Bull Academy" };

export default async function CursosPage() {
  const { snapshot } = await getStudentContext();

  const traderProgress = (() => {
    if (!snapshot) return { completed: 0, total: 1, percent: 0 };
    const modules = filterLaunchModules(snapshot.modules);
    const total = Math.max(modules.length, 1);
    const completed = modules.filter((module) => module.progress.percent === 100).length;
    const percent =
      modules.length === 0
        ? 0
        : Math.floor(modules.reduce((acc, module) => acc + module.progress.percent, 0) / modules.length);
    return { completed, total, percent };
  })();

  return <FormationsCatalog traderProgress={traderProgress} />;
}
