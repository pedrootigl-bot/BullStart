import { config } from "dotenv";
import { describe, expect, it } from "vitest";
import { SIGNATURE_HEADER, signPayload } from "@/lib/broker/signature";

config({ path: ".env.local" });

const base = process.env.TEST_APP_URL ?? "http://localhost:3000";
const enabled = process.env.RUN_HTTP === "1";
const LESSON_ID = "e0000000-0000-4000-8000-000000000001";

describe.skipIf(!enabled)("HTTP: proteção de rotas e APIs", () => {
  it("rotas privadas redirecionam visitantes para o login", async () => {
    for (const path of ["/plataforma", "/plataforma/certificado", "/admin", "/admin/alunos"]) {
      const response = await fetch(`${base}${path}`, { redirect: "manual" });
      expect([302, 307, 308]).toContain(response.status);
      expect(response.headers.get("location") ?? "").toContain("/login");
    }
  });

  it("APIs exigem autenticação", async () => {
    const playback = await fetch(`${base}/api/lessons/${LESSON_ID}/playback`);
    expect(playback.status).toBe(401);
    const progress = await fetch(`${base}/api/lessons/${LESSON_ID}/progress`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: base },
      body: JSON.stringify({ position: 10, watchedSeconds: 10 }),
    });
    expect(progress.status).toBe(401);
  });

  it("mutações de outra origem são recusadas", async () => {
    const response = await fetch(`${base}/api/lessons/${LESSON_ID}/complete`, {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(response.status).toBe(403);
  });

  it("webhook recusa assinatura ausente ou inválida", async () => {
    const body = JSON.stringify({ id: "evt_test", type: "eligibility.updated" });
    const missing = await fetch(`${base}/api/webhooks/broker`, { method: "POST", body, headers: { "content-type": "application/json" } });
    expect(missing.status).toBe(401);
    const forged = await fetch(`${base}/api/webhooks/broker`, {
      method: "POST",
      body,
      headers: { "content-type": "application/json", [SIGNATURE_HEADER]: signPayload("f".repeat(48), body, Math.floor(Date.now() / 1000)) },
    });
    expect(forged.status).toBe(401);
  });

  it("verificação pública de certificado responde para código inexistente", async () => {
    const response = await fetch(`${base}/certificado/verificar/BXS-0000-0000-0000`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("não encontrado");
  });

  it("aplica cabeçalhos de segurança", async () => {
    const response = await fetch(`${base}/`);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-powered-by")).toBeNull();
  });
});
