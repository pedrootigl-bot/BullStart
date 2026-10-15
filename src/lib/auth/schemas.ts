import { z } from "zod";

const email = z.email("Informe um e-mail válido.").trim().toLowerCase().max(320);

const password = z
  .string()
  .min(8, "A senha precisa ter pelo menos 8 caracteres.")
  .max(72, "A senha pode ter no máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "Inclua ao menos uma letra.")
  .regex(/\d/, "Inclua ao menos um número.");

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha.").max(72),
  next: z.string().max(512).optional(),
});

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(3, "Informe seu nome completo.").max(120),
    email,
    password,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, { error: "É necessário aceitar os Termos de Uso e a Política de Privacidade." }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export const resetRequestSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.input<typeof signUpSchema>;
export type ResetRequestValues = z.infer<typeof resetRequestSchema>;
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
