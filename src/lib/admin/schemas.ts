import { z } from "zod";
import { REQUIREMENT_TYPES } from "@/lib/access/requirements";

export const uuidSchema = z.uuid("Identificador inválido.");

export const lineListSchema = z.array(z.string().trim().min(1).max(200)).max(12, "Máximo de 12 itens.");

export const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug deve conter apenas letras minúsculas, números e hífens.")
  .max(120);

export const reasonSchema = z.string().trim().min(5, "Informe um motivo com pelo menos 5 caracteres.").max(500);

export const courseSettingsSchema = z.object({
  courseId: uuidSchema,
  workloadHours: z.coerce.number().int().min(1, "Carga horária mínima de 1 hora.").max(1000),
  minWatchPercent: z.coerce.number().int().min(50, "Mínimo de 50%.").max(100, "Máximo de 100%."),
});

export const moduleInputSchema = z.object({
  id: uuidSchema.optional(),
  title: z.string().trim().min(3, "Título deve ter pelo menos 3 caracteres.").max(140),
  slug: z.union([slugSchema, z.literal("")]).optional(),
  description: z.string().trim().max(2000),
  topics: lineListSchema,
  isPublished: z.boolean(),
});

export const requirementRuleInputSchema = z.object({
  type: z.enum(REQUIREMENT_TYPES),
  config: z.record(z.string(), z.unknown()),
});

export const moduleRequirementsSchema = z.object({
  moduleId: uuidSchema,
  rules: z.array(requirementRuleInputSchema).max(6, "Máximo de 6 regras por módulo."),
});

export const materialSchema = z.object({
  title: z.string().trim().min(2).max(120),
  url: z.url().refine((value) => value.startsWith("https://"), "Materiais devem usar https."),
});

export const lessonInputSchema = z.object({
  id: uuidSchema.optional(),
  moduleId: uuidSchema,
  title: z.string().trim().min(3, "Título deve ter pelo menos 3 caracteres.").max(140),
  description: z.string().trim().max(4000),
  objectives: lineListSchema,
  topics: lineListSchema,
  materials: z.array(materialSchema).max(10),
  thumbnailUrl: z.string().trim().max(1024),
  videoProvider: z.enum(["supabase_storage", "external_url"]),
  videoAssetId: z.string().trim().max(1024),
  durationSeconds: z.coerce.number().int().min(0).max(86400),
  isRequired: z.boolean(),
  isPublished: z.boolean(),
});

export const moveSchema = z.object({ id: uuidSchema, direction: z.union([z.literal(-1), z.literal(1)]) });

export const publishSchema = z.object({ id: uuidSchema, published: z.boolean() });

export const idSchema = z.object({ id: uuidSchema });

export const videoUploadSchema = z.object({
  lessonId: uuidSchema,
  fileName: z.string().trim().min(1).max(200),
  contentType: z.enum(["video/mp4", "video/webm"], "Envie um arquivo MP4 ou WebM."),
});

export const attachVideoSchema = z.object({
  lessonId: uuidSchema,
  path: z.string().max(512),
  durationSeconds: z.coerce.number().int().min(0).max(86400),
});

export const thumbnailUploadSchema = z.object({
  lessonId: uuidSchema,
  fileName: z.string().trim().min(1).max(200),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"], "Envie JPEG, PNG, WebP ou GIF."),
});

export const attachThumbnailSchema = z.object({
  lessonId: uuidSchema,
  path: z.string().max(512),
});

export const grantAccessSchema = z.object({
  userId: uuidSchema,
  moduleId: uuidSchema,
  reason: reasonSchema,
  expiresAt: z.union([z.iso.date(), z.literal("")]).optional(),
});

export const revokeAccessSchema = z.object({ userId: uuidSchema, moduleId: uuidSchema, reason: reasonSchema });

export const revokeCertificateSchema = z.object({ certificateId: uuidSchema, reason: reasonSchema });
