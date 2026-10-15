"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { FormAlert } from "@/components/auth/auth-shell";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, FieldError, Input } from "@/components/ui/field";
import { requestPasswordResetAction, signInAction, signUpAction, updatePasswordAction } from "@/lib/auth/actions";
import {
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  type ActionResult,
  type ResetRequestValues,
  type SignInValues,
  type SignUpValues,
  type UpdatePasswordValues,
} from "@/lib/auth/schemas";

function useServerAction() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (action: () => Promise<ActionResult | void>) => {
    setResult(null);
    startTransition(async () => {
      try {
        const response = await action();
        if (response) setResult(response);
      } catch (error) {
        // Erros de navegação do Next.js (redirect) carregam "digest" e não devem virar mensagem de falha.
        if (typeof error === "object" && error !== null && "digest" in error) return;
        setResult({ ok: false, error: "Não foi possível concluir agora. Verifique sua conexão e tente novamente." });
      }
    });
  };
  return { pending, result, run };
}

function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />}
      {pending ? "Aguarde..." : children}
    </Button>
  );
}

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const { pending, result, run } = useServerAction();
  const form = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: "", password: "", next } });
  const { errors } = form.formState;

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => run(() => signInAction(values)))} className="flex flex-col gap-5">
      {notice && <FormAlert tone="info">{notice}</FormAlert>}
      {result && !result.ok && <FormAlert tone="error">{result.error}</FormAlert>}

      <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="voce@email.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...form.register("email")}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium text-mist-100">
            Senha
          </label>
          <Link href="/recuperar-senha" className="text-xs font-medium text-brand-400 hover:text-brand-300">
            Esqueci minha senha
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "password-error" : undefined}
          {...form.register("password")}
        />
        <FieldError id="password-error">{errors.password?.message}</FieldError>
      </div>

      <SubmitButton pending={pending}>Entrar</SubmitButton>
    </form>
  );
}

export function SignUpForm() {
  const { pending, result, run } = useServerAction();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", acceptTerms: false as unknown as true },
  });
  const { errors } = form.formState;

  if (result?.ok) return <FormAlert tone="success">{result.message}</FormAlert>;

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => run(() => signUpAction(values)))} className="flex flex-col gap-5">
      {result && !result.ok && <FormAlert tone="error">{result.error}</FormAlert>}

      <Field label="Nome completo" htmlFor="fullName" error={errors.fullName?.message} hint="Este nome será usado no seu certificado.">
        <Input id="fullName" autoComplete="name" aria-invalid={Boolean(errors.fullName)} {...form.register("fullName")} />
      </Field>
      <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...form.register("email")} />
      </Field>
      <Field label="Senha" htmlFor="password" error={errors.password?.message} hint="Mínimo de 8 caracteres, com letras e números.">
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...form.register("password")} />
      </Field>
      <Field label="Confirmar senha" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...form.register("confirmPassword")}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm text-mist-300">
          <Checkbox className="mt-0.5" {...form.register("acceptTerms")} />
          <span>
            Li e aceito os{" "}
            <Link href="/termos" className="text-brand-400 underline-offset-2 hover:underline" target="_blank">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="text-brand-400 underline-offset-2 hover:underline" target="_blank">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        <FieldError>{errors.acceptTerms?.message}</FieldError>
      </div>

      <SubmitButton pending={pending}>Criar minha conta</SubmitButton>
    </form>
  );
}

export function ResetRequestForm() {
  const { pending, result, run } = useServerAction();
  const form = useForm<ResetRequestValues>({ resolver: zodResolver(resetRequestSchema), defaultValues: { email: "" } });
  const { errors } = form.formState;

  if (result?.ok) return <FormAlert tone="success">{result.message}</FormAlert>;

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => run(() => requestPasswordResetAction(values)))}
      className="flex flex-col gap-5"
    >
      {result && !result.ok && <FormAlert tone="error">{result.error}</FormAlert>}
      <Field label="E-mail da sua conta" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} {...form.register("email")} />
      </Field>
      <SubmitButton pending={pending}>Enviar link de recuperação</SubmitButton>
    </form>
  );
}

export function UpdatePasswordForm() {
  const { pending, result, run } = useServerAction();
  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => run(() => updatePasswordAction(values)))} className="flex flex-col gap-5">
      {result && !result.ok && <FormAlert tone="error">{result.error}</FormAlert>}
      <Field label="Nova senha" htmlFor="password" error={errors.password?.message} hint="Mínimo de 8 caracteres, com letras e números.">
        <PasswordInput id="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...form.register("password")} />
      </Field>
      <Field label="Confirmar nova senha" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          {...form.register("confirmPassword")}
        />
      </Field>
      <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>
    </form>
  );
}
