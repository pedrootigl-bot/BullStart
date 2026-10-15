import { randomBytes } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export const CERTIFICATE_CODE_PATTERN = /^BXS-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

/** Código não sequencial com 60 bits de entropia, ex.: BXS-7K2M-Q9TR-4HXA. */
export function generateVerificationCode(): string {
  const bytes = randomBytes(12);
  const chars = Array.from(bytes, (byte) => ALPHABET[byte % 32]);
  return `BXS-${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}-${chars.slice(8, 12).join("")}`;
}

export function normalizeVerificationCode(input: string): string | null {
  const normalized = input.trim().toUpperCase().replace(/[O]/g, "0").replace(/[IL]/g, "1");
  return CERTIFICATE_CODE_PATTERN.test(normalized) ? normalized : null;
}
