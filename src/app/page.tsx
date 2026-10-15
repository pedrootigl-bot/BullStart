import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { About, CertificateSection, Formation, Hero, type CatalogModule } from "@/components/landing/sections";
import { getSessionUser } from "@/lib/auth/session";
import { getEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loadCatalog(): Promise<CatalogModule[] | null> {
  const supabase = await createSupabaseServerClient();
  try {
    const { data, error } = await supabase.rpc("public_catalog", { p_course_slug: getEnv().PRIMARY_COURSE_SLUG });
    if (error) {
      console.error("[landing] falha ao carregar catálogo", error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error("[landing] catálogo indisponível", error instanceof Error ? error.message : error);
    return null;
  }
}

export default async function HomePage() {
  const [session, modules] = await Promise.all([getSessionUser().catch(() => null), loadCatalog()]);
  const authenticated = Boolean(session);
  const accessHref = authenticated ? "/plataforma" : "/login";
  const moduleHref = (slug: string) =>
    authenticated
      ? `/plataforma/modulo/${slug}`
      : `/login?next=${encodeURIComponent(`/plataforma/modulo/${slug}`)}`;

  return (
    <>
      <Navbar accessHref={accessHref} />
      <main id="conteudo" className="flex-1">
        <Hero startHref={accessHref} moduleCount={modules?.length ?? 0} />
        <About accessHref={accessHref} />
        <Formation modules={modules} moduleHref={moduleHref} />
        <CertificateSection startHref={accessHref} />
      </main>
      <Footer />
    </>
  );
}
