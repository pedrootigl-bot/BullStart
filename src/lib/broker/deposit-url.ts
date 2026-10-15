/**
 * Valida a URL oficial de depósito: precisa ser https e pertencer a um host oficial
 * explicitamente autorizado. Qualquer outra situação resulta em "sem destino".
 */
export function validateOfficialUrl(candidate: string | null | undefined, allowedHosts: string[]): string | null {
  if (!candidate || allowedHosts.length === 0) return null;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const allowed = allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
  return allowed ? url.toString() : null;
}
