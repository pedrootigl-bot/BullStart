/** Persistência local: módulos cuja parabenização já foi exibida neste navegador. */

const STORAGE_KEY = "bull-academy:celebrated-modules";

function readIds(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // storage indisponível (modo privado / cota) — ignora
  }
}

export function hasCelebratedModule(moduleId: string): boolean {
  return readIds().includes(moduleId);
}

export function markModuleCelebrated(moduleId: string) {
  writeIds([...readIds(), moduleId]);
}

export type CelebratableModule = {
  id: string;
  title: string;
};
