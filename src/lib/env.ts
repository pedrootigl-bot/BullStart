import "server-only";
import { z } from "zod";

const csv = z
  .string()
  .optional()
  .transform((value) =>
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );

const optionalUrl = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() ? value.trim() : undefined))
  .pipe(z.url().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url(),
  SUPABASE_URL: z.url(),
  SUPABASE_PUBLIC_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  PRIMARY_COURSE_SLUG: z.string().regex(/^[a-z0-9-]+$/).default("formacao-trader-bullex"),
  BROKER_INTEGRATION_MODE: z.enum(["disabled", "mock", "official"]).default("disabled"),
  BROKER_WEBHOOK_SECRET: z
    .string()
    .optional()
    .transform((value) => (value && value.trim() ? value.trim() : undefined))
    .pipe(z.string().min(32).optional()),
  BROKER_MOCK_ELIGIBLE_KEYS: csv,
  BROKER_OFFICIAL_DEPOSIT_URL: optionalUrl,
  BROKER_OFFICIAL_ALLOWED_HOSTS: csv,
  VIDEO_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(86_400).default(14_400),
  VIDEO_EXTERNAL_ALLOWED_HOSTS: csv,
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Configuração de ambiente inválida: ${fields}`);
  }
  cached = parsed.data;
  return cached;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production";
}
