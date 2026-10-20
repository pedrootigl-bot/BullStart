import type { CourseSnapshot } from "@/lib/access/snapshot";

/**
 * Lançamento v1: apenas o módulo 1 fica visível para alunos no site/plataforma.
 * Módulos 2+ permanecem no banco e no admin; na v2 basta ampliar este conjunto.
 */
export const LAUNCH_VISIBLE_MODULE_POSITIONS = new Set([1]);

export function isLaunchVisibleModule(position: number): boolean {
  return LAUNCH_VISIBLE_MODULE_POSITIONS.has(position);
}

export function filterLaunchModules<T extends { position: number }>(modules: T[]): T[] {
  return modules.filter((module) => isLaunchVisibleModule(module.position));
}

/** Conclusão exigida do aluno na v1 (só módulos liberados no lançamento). */
export function isLaunchCourseComplete(snapshot: CourseSnapshot): boolean {
  const modules = filterLaunchModules(snapshot.modules);
  if (modules.length === 0) return false;
  return modules.every((module) => module.progress.totalRequired > 0 && module.progress.percent === 100);
}

export function launchModuleIds(snapshot: CourseSnapshot): string[] {
  return filterLaunchModules(snapshot.modules).map((module) => module.id);
}
