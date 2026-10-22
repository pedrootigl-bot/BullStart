import "server-only";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { isSafeStoragePath, validateExternalVideoUrl } from "@/lib/video/external";

export const VIDEO_BUCKET = "lesson-videos";
export const THUMBNAIL_BUCKET = "lesson-thumbnails";

export type Playback =
  | { ok: true; url: string; expiresAt: string | null }
  | { ok: false; reason: "no_video" | "invalid_reference" | "provider_error" };

/**
 * Resolve a URL de reprodução de uma aula. Deve ser chamada SOMENTE depois que o acesso ao
 * módulo foi autorizado no servidor. Vídeos privados recebem URL assinada temporária.
 */
export async function resolvePlayback(lessonId: string): Promise<Playback> {
  const env = getEnv();
  const db = getSupabaseAdmin();
  const { data: lesson } = await db
    .from("lessons")
    .select("video_provider, video_asset_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson?.video_asset_id) return { ok: false, reason: "no_video" };

  const provider = lesson.video_provider;
  switch (provider) {
    case "supabase_storage": {
      if (!isSafeStoragePath(lesson.video_asset_id)) return { ok: false, reason: "invalid_reference" };
      const ttl = env.VIDEO_SIGNED_URL_TTL_SECONDS;
      const { data, error } = await db.storage.from(VIDEO_BUCKET).createSignedUrl(lesson.video_asset_id, ttl);
      if (error || !data?.signedUrl) {
        console.error("[video] falha ao assinar URL", error?.message);
        return { ok: false, reason: "provider_error" };
      }
      return {
        ok: true,
        url: toPublicSupabaseUrl(data.signedUrl, env.SUPABASE_URL, env.SUPABASE_PUBLIC_URL),
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
      };
    }
    case "external_url": {
      const url = validateExternalVideoUrl(lesson.video_asset_id, env.VIDEO_EXTERNAL_ALLOWED_HOSTS);
      return url ? { ok: true, url, expiresAt: null } : { ok: false, reason: "invalid_reference" };
    }
    default: {
      const unreachable: never = provider;
      return unreachable;
    }
  }
}

/** O servidor pode falar com o Supabase por um endereço interno; o navegador precisa do público. */
export function toPublicSupabaseUrl(url: string, internalBase: string, publicBase: string): string {
  const internal = new URL(internalBase);
  const target = new URL(url);
  if (target.origin !== internal.origin) return url;
  const pub = new URL(publicBase);
  target.protocol = pub.protocol;
  target.host = pub.host;
  return target.toString();
}
