import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

export type AuditEntry = {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, Json | undefined>;
};

export async function recordAudit(entry: AuditEntry): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from("audit_logs")
    .insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      metadata: (entry.metadata ?? {}) as NonNullable<Json>,
    });
  if (error) {
    console.error("[audit] falha ao registrar auditoria", entry.action, error.message);
  }
}
