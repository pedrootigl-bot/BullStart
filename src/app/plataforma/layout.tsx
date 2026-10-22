import type { Metadata } from "next";
import { PlatformShell } from "@/components/platform/platform-shell";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Plataforma", robots: { index: false } };

export default async function PlatformLayout({ children }: LayoutProps<"/plataforma">) {
  const { profile } = await requireUser();
  return (
    <PlatformShell name={profile.full_name} email={profile.email} isAdmin={profile.role === "admin"}>
      {children}
    </PlatformShell>
  );
}
