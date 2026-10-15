import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: { default: "Administração", template: "%s · Admin Bullex Start" }, robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { profile } = await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <AdminNav name={profile.full_name || profile.email} />
      <main id="conteudo" className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
