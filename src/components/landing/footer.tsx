import Link from "next/link";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-mist-400">
            Plataforma educacional da Bullex. Sua jornada para evoluir como trader começa aqui.
          </p>
        </div>

        <nav aria-label="Institucional">
          <h2 className="text-sm font-semibold text-mist-50">Bullex Start</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-mist-400">
            <li>
              <Link href="/#sobre" className="hover:text-brand-300">Sobre</Link>
            </li>
            <li>
              <Link href="/#formacao" className="hover:text-brand-300">Formação</Link>
            </li>
            <li>
              <Link href="/#certificado" className="hover:text-brand-300">Certificado</Link>
            </li>
            <li>
              <Link href="/certificado/verificar" className="hover:text-brand-300">Verificar certificado</Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <h2 className="text-sm font-semibold text-mist-50">Legal</h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-mist-400">
            <li>
              <Link href="/privacidade" className="hover:text-brand-300">Política de Privacidade</Link>
            </li>
            <li>
              <Link href="/termos" className="hover:text-brand-300">Termos de Uso</Link>
            </li>
            <li>
              <Link href="/aviso-de-riscos" className="hover:text-brand-300">Aviso de riscos</Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs leading-relaxed text-mist-500 sm:px-8">
          <p>
            <strong className="font-semibold text-mist-400">Aviso importante:</strong> o conteúdo do Bullex Start tem
            finalidade exclusivamente educacional, não constitui recomendação personalizada de investimento e não
            garante resultados. Operações no mercado financeiro envolvem riscos, inclusive de perda do capital
            investido. Resultados passados não garantem resultados futuros.
          </p>
          <p>© {year} Bullex Start. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
