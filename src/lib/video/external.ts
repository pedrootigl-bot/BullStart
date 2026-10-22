/** Aceita somente https em hosts explicitamente autorizados. */
export function validateExternalVideoUrl(candidate: string, allowedHosts: string[]): string | null {
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`)) ? url.toString() : null;
}

/** Caminhos de objeto do Storage: segmentos seguros, sem traversal. */
export function isSafeStoragePath(path: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*(\/[a-zA-Z0-9][a-zA-Z0-9._-]*)*$/.test(path) && !path.includes("..") && path.length <= 512;
}

export function isSafeImageUrl(candidate: string): boolean {
  if (candidate.startsWith("/") && !candidate.startsWith("//")) return /^\/[a-zA-Z0-9/._-]+$/.test(candidate);
  try {
    const url = new URL(candidate);
    if (url.username || url.password) return false;
    if (url.protocol === "https:") return true;
    // Supabase local (e similares) serve o bucket público em http://127.0.0.1
    return url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
  } catch {
    return false;
  }
}
