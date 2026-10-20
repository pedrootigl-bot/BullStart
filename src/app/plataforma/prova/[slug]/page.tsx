import { redirect } from "next/navigation";

/** Rota antiga — a prova fica no final do módulo. */
export default async function ModuleQuizRedirectPage({ params }: PageProps<"/plataforma/prova/[slug]">) {
  const { slug } = await params;
  redirect(`/plataforma/modulo/${slug}#prova`);
}
