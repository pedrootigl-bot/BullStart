/**
 * Envia um evento ASSINADO ao webhook local, simulando o contrato proposto da Bullex.
 * Útil para validar ponta a ponta o vínculo e a liberação por elegibilidade sem usar o modo mock.
 *
 * Exemplos:
 *   npm run broker:event -- eligibility DEV-LOCAL-0001 account_funding_confirmed eligible
 *   npm run broker:event -- customer DEV-LOCAL-0002 novo@bullacademy.local "Rafael Nogueira"
 */
import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { SIGNATURE_HEADER, signPayload } from "../src/lib/broker/signature";

config({ path: ".env.local" });

async function main() {
  const secret = process.env.BROKER_WEBHOOK_SECRET;
  const target = process.env.WEBHOOK_TARGET_URL ?? `${process.env.APP_URL ?? "http://localhost:3000"}/api/webhooks/broker`;
  if (!secret) throw new Error("Defina BROKER_WEBHOOK_SECRET em .env.local.");

  const [kind, brokerUserId, arg3, arg4] = process.argv.slice(2);
  const occurredAt = new Date().toISOString();
  let event: Record<string, unknown>;

  if (kind === "eligibility" && brokerUserId && arg3) {
    event = {
      id: `evt_${randomUUID()}`,
      type: "eligibility.updated",
      occurred_at: occurredAt,
      data: { broker_user_id: brokerUserId, requirement_key: arg3, status: arg4 ?? "eligible", expires_at: null },
    };
  } else if (kind === "customer" && brokerUserId && arg3) {
    event = {
      id: `evt_${randomUUID()}`,
      type: "customer.upserted",
      occurred_at: occurredAt,
      data: { broker_user_id: brokerUserId, email: arg3, ...(arg4 ? { full_name: arg4 } : {}), account_status: "active", verification_status: "verified" },
    };
  } else {
    throw new Error(
      "Uso: broker:event -- eligibility <broker_user_id> <requirement_key> [eligible|not_eligible|pending]\n" +
        "     broker:event -- customer <broker_user_id> <email> [nome]",
    );
  }

  const body = JSON.stringify(event);
  const signature = signPayload(secret, body, Math.floor(Date.now() / 1000));
  const response = await fetch(target, {
    method: "POST",
    headers: { "content-type": "application/json", [SIGNATURE_HEADER]: signature },
    body,
  });
  console.log(`${response.status} ${await response.text()}`);
  if (!response.ok) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
