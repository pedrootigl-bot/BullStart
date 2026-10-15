import type { Metadata } from "next";
import { PlatformHeader } from "@/components/platform/platform-header";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Plataforma", robots: { index: false } };

export default async function PlatformLayout({ children }: LayoutProps<"/plataforma">) {
  const { profile } = await requireUser();
  return (
    <>
      <PlatformHeader name={profile.full_name} email={profile.email} isAdmin={profile.role === "admin"} />
      <main id="conteudo" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {children}
      </main>
      <footer className="border-t border-white/[0.06] px-4 py-6 text-center text-xs leading-relaxed text-mist-500">
        Conteúdo educacional. Não constitui recomendação personalizada de investimento e não garante resultados.
      </footer>
    </>
  );
}
