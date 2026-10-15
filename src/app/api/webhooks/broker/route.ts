import { NextResponse } from "next/server";
import { SIGNATURE_HEADER, sha256Hex, verifySignature } from "@/lib/broker/signature";
import { getBrokerIntegration } from "@/lib/broker/service";
import { brokerEventSchema, type SyncResult } from "@/lib/broker/types";
import { getEnv } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const MAX_BODY_BYTES = 64 * 1024;

function reply(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Webhook da corretora (contrato proposto — ver documents/INTEGRACAO_BULLEX.md).
 * 1. Valida HMAC-SHA256 + janela de tempo (anti-replay).
 * 2. Garante idempotência por event id (tabela broker_events).
 * 3. Processa via BrokerIntegrationService.
 */
export async function POST(request: Request) {
  const secret = getEnv().BROKER_WEBHOOK_SECRET;
  if (!secret) return reply(503, { ok: false, error: "webhook_not_configured" });

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) return reply(413, { ok: false, error: "payload_too_large" });

  const signature = verifySignature(secret, rawBody, request.headers.get(SIGNATURE_HEADER));
  if (!signature.valid) return reply(401, { ok: false, error: "invalid_signature" });

  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return reply(400, { ok: false, error: "invalid_json" });
  }
  const parsed = brokerEventSchema.safeParse(json);
  if (!parsed.success) return reply(400, { ok: false, error: "invalid_event" });
  const event = parsed.data;

  const db = getSupabaseAdmin();
  const { error: insertError } = await db.from("broker_events").insert({
    event_id: event.id,
    event_type: event.type,
    occurred_at: event.occurred_at,
    payload_sha256: sha256Hex(rawBody),
  });

  if (insertError) {
    if (insertError.code !== "23505") {
      console.error("[webhook] falha ao registrar evento", insertError.message);
      return reply(500, { ok: false, error: "storage_error" });
    }
    const { data: existing } = await db.from("broker_events").select("status").eq("event_id", event.id).single();
    if (existing?.status !== "failed") return reply(200, { ok: true, duplicate: true, status: existing?.status });
    await db.from("broker_events").update({ status: "processing", result: null }).eq("event_id", event.id);
  }

  const broker = getBrokerIntegration();
  let result: SyncResult;
  try {
    switch (event.type) {
      case "customer.upserted":
        result = await broker.syncBrokerCustomer(event);
        break;
      case "eligibility.updated":
        result = await broker.syncEligibilityEvent(event);
        break;
      default: {
        const unreachable: never = event;
        throw new Error(`unsupported_event ${String(unreachable)}`);
      }
    }
  } catch (error) {
    console.error("[webhook] falha ao processar evento", event.id, error instanceof Error ? error.message : error);
    await db
      .from("broker_events")
      .update({ status: "failed", result: "processing_error", processed_at: new Date().toISOString() })
      .eq("event_id", event.id);
    return reply(500, { ok: false, error: "processing_error" });
  }

  await db
    .from("broker_events")
    .update({ status: result.status, result: result.detail, processed_at: new Date().toISOString() })
    .eq("event_id", event.id);

  return reply(200, { ok: true, status: result.status, detail: result.detail });
}
