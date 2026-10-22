import { describe, expect, it } from "vitest";
import { validateRequirementInput } from "@/lib/access/requirements";
import { validateOfficialUrl } from "@/lib/broker/deposit-url";
import { brokerEventSchema } from "@/lib/broker/types";
import { signPayload, verifySignature } from "@/lib/broker/signature";
import { CERTIFICATE_CODE_PATTERN, generateVerificationCode, normalizeVerificationCode } from "@/lib/certificates/code";
import { formatClock, formatDuration, slugify } from "@/lib/format";
import { isSafeImageUrl, isSafeStoragePath, validateExternalVideoUrl } from "@/lib/video/external";

describe("assinatura de webhook", () => {
  const secret = "s".repeat(48);
  const body = JSON.stringify({ id: "evt_1" });
  const now = 1_800_000_000;

  it("aceita assinatura válida dentro da janela", () => {
    expect(verifySignature(secret, body, signPayload(secret, body, now), now + 10)).toEqual({ valid: true, timestamp: now });
  });

  it("rejeita corpo adulterado, segredo errado, ausente, malformado e expirado", () => {
    const header = signPayload(secret, body, now);
    expect(verifySignature(secret, `${body} `, header, now).valid).toBe(false);
    expect(verifySignature("x".repeat(48), body, header, now).valid).toBe(false);
    expect(verifySignature(secret, body, null, now)).toEqual({ valid: false, reason: "missing" });
    expect(verifySignature(secret, body, "v1=abc", now)).toEqual({ valid: false, reason: "malformed" });
    expect(verifySignature(secret, body, header, now + 301)).toEqual({ valid: false, reason: "expired" });
  });
});

describe("eventos da corretora", () => {
  it("valida eligibility.updated e rejeita campos financeiros fora do contrato", () => {
    const ok = brokerEventSchema.safeParse({
      id: "evt_1",
      type: "eligibility.updated",
      occurred_at: "2026-10-13T12:00:00Z",
      data: { broker_user_id: "B1", requirement_key: "account_funding_confirmed", status: "eligible" },
    });
    expect(ok.success).toBe(true);
    const bad = brokerEventSchema.safeParse({
      id: "evt_2",
      type: "eligibility.updated",
      occurred_at: "2026-10-13T12:00:00Z",
      data: { broker_user_id: "B1", requirement_key: "INVALID KEY", status: "eligible" },
    });
    expect(bad.success).toBe(false);
  });
});

describe("URL oficial de depósito", () => {
  const hosts = ["bullex.com"];
  it("aceita somente https em host autorizado", () => {
    expect(validateOfficialUrl("https://app.bullex.com/deposit", hosts)).toBe("https://app.bullex.com/deposit");
    expect(validateOfficialUrl("http://app.bullex.com/deposit", hosts)).toBeNull();
    expect(validateOfficialUrl("https://bullex.com.evil.io/deposit", hosts)).toBeNull();
    expect(validateOfficialUrl("https://user:pass@bullex.com/", hosts)).toBeNull();
    expect(validateOfficialUrl("https://bullex.com/", [])).toBeNull();
    expect(validateOfficialUrl(undefined, hosts)).toBeNull();
  });
});

describe("validadores de mídia", () => {
  it("URL externa de vídeo exige https e host autorizado", () => {
    expect(validateExternalVideoUrl("https://cdn.example.com/v.mp4", ["example.com"])).toBe("https://cdn.example.com/v.mp4");
    expect(validateExternalVideoUrl("http://cdn.example.com/v.mp4", ["example.com"])).toBeNull();
    expect(validateExternalVideoUrl("https://example.com.attacker.net/v.mp4", ["example.com"])).toBeNull();
    expect(validateExternalVideoUrl("javascript:alert(1)", ["example.com"])).toBeNull();
  });

  it("caminhos do Storage bloqueiam traversal", () => {
    expect(isSafeStoragePath("demo/aula-demo-a.mp4")).toBe(true);
    expect(isSafeStoragePath("../secret.mp4")).toBe(false);
    expect(isSafeStoragePath("demo/../../x.mp4")).toBe(false);
    expect(isSafeStoragePath("/abs/path.mp4")).toBe(false);
  });

  it("miniaturas aceitam https, localhost ou caminho local", () => {
    expect(isSafeImageUrl("https://img.example.com/a.jpg")).toBe(true);
    expect(isSafeImageUrl("/images/a.jpg")).toBe(true);
    expect(isSafeImageUrl("http://127.0.0.1:54321/storage/v1/object/public/lesson-thumbnails/a.jpg")).toBe(true);
    expect(isSafeImageUrl("http://localhost:54321/storage/v1/object/public/lesson-thumbnails/a.jpg")).toBe(true);
    expect(isSafeImageUrl("http://evil.com/a.jpg")).toBe(false);
    expect(isSafeImageUrl("//evil.com/a.jpg")).toBe(false);
    expect(isSafeImageUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("código de certificado", () => {
  it("gera códigos no formato e não repetidos", () => {
    const codes = new Set(Array.from({ length: 500 }, generateVerificationCode));
    expect(codes.size).toBe(500);
    for (const code of codes) expect(CERTIFICATE_CODE_PATTERN.test(code)).toBe(true);
  });

  it("normaliza entrada do usuário e rejeita formatos inválidos", () => {
    expect(normalizeVerificationCode(" bxs-7k2m-q9tr-4hxa ")).toBe("BXS-7K2M-Q9TR-4HXA");
    expect(normalizeVerificationCode("BXS-OOOO-IIII-LLLL")).toBe("BXS-0000-1111-1111");
    expect(normalizeVerificationCode("BXS-123")).toBeNull();
    expect(normalizeVerificationCode("' or 1=1 --")).toBeNull();
  });
});

describe("requisitos do painel", () => {
  it("rejeita configurações sem version ou com campos desconhecidos", () => {
    expect(validateRequirementInput({ type: "FREE", config: {} }).ok).toBe(false);
    expect(validateRequirementInput({ type: "FREE", config: { version: 1, extra: true } }).ok).toBe(false);
    expect(validateRequirementInput({ type: "COMBINED", config: { version: 1, operator: "AND", rules: [] } }).ok).toBe(false);
    expect(validateRequirementInput({ type: "UNKNOWN", config: { version: 1 } }).ok).toBe(false);
  });

  it("aplica padrões versionados", () => {
    const parsed = validateRequirementInput({ type: "PREVIOUS_MODULE", config: { version: 1 } });
    expect(parsed.ok && parsed.requirement.type === "PREVIOUS_MODULE" && parsed.requirement.config.min_completion_percent).toBe(100);
  });
});

describe("formatação", () => {
  it("formata durações e slugs", () => {
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatDuration(90)).toMatch(/1/);
    expect(slugify("Gestão de Risco & Psicologia")).toBe("gestao-de-risco-psicologia");
  });
});
