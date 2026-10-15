import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Assinatura de webhooks (contrato proposto):
 *   Header  x-bullex-signature: t=<unix_seconds>,v1=<hex(hmac_sha256(secret, `${t}.${rawBody}`))>
 * A janela de tolerância limita replay; a idempotência por event id é garantida no banco.
 */

export const SIGNATURE_HEADER = "x-bullex-signature";
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export type SignatureCheck =
  | { valid: true; timestamp: number }
  | { valid: false; reason: "missing" | "malformed" | "expired" | "mismatch" };

export function signPayload(secret: string, rawBody: string, timestamp: number): string {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

export function verifySignature(
  secret: string,
  rawBody: string,
  header: string | null,
  nowSeconds: number = Math.floor(Date.now() / 1000),
  toleranceSeconds: number = SIGNATURE_TOLERANCE_SECONDS,
): SignatureCheck {
  if (!header) return { valid: false, reason: "missing" };

  const parts = new Map<string, string[]>();
  for (const segment of header.split(",")) {
    const [key, ...rest] = segment.trim().split("=");
    if (!key || rest.length === 0) continue;
    const list = parts.get(key) ?? [];
    list.push(rest.join("="));
    parts.set(key, list);
  }

  const timestampRaw = parts.get("t")?.[0];
  const signatures = parts.get("v1") ?? [];
  if (!timestampRaw || !/^\d{1,12}$/.test(timestampRaw) || signatures.length === 0) {
    return { valid: false, reason: "malformed" };
  }

  const timestamp = Number(timestampRaw);
  if (Math.abs(nowSeconds - timestamp) > toleranceSeconds) return { valid: false, reason: "expired" };

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"),
    "utf8",
  );
  const matches = signatures.some((candidate) => {
    const received = Buffer.from(candidate, "utf8");
    return received.length === expected.length && timingSafeEqual(received, expected);
  });

  return matches ? { valid: true, timestamp } : { valid: false, reason: "mismatch" };
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
