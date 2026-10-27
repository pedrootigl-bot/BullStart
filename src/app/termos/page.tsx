import type { Metadata } from "next";
import { LegalArticle, PublicShell } from "@/components/public-shell";

export const metadata: Metadata = { title: "Termos de Uso" };

export default function TermsPage() {
  return (
    <PublicShell>
      <LegalArticle title="Termos de Uso" updatedAt="13 de outubro de 2026">
        <p>Ao criar uma conta na Bull Academy você concorda com estes termos.</p>
        <h2>Natureza do serviço</h2>
        <p>
          A Bull Academy é uma plataforma de conteúdo educacional sobre mercado financeiro. O conteúdo não constitui
          recomendação personalizada de investimento, consultoria ou promessa de resultados.
        </p>
        <h2>Conta e acesso</h2>
        <ul>
          <li>A conta é pessoal e intransferível; mantenha suas credenciais em sigilo.</li>
          <li>Alguns módulos possuem requisitos de liberação, que podem depender de confirmações da corretora.</li>
          <li>É proibido tentar contornar mecanismos de acesso, reproduzir ou redistribuir o conteúdo.</li>
        </ul>
        <h2>Certificado</h2>
        <p>
          O certificado comprova a conclusão do programa educacional livre e não representa habilitação profissional,
          certificação regulatória ou reconhecimento por órgãos oficiais. Certificados emitidos indevidamente podem ser
          revogados.
        </p>
        <h2>Alterações</h2>
        <p>Conteúdos, módulos e regras de acesso podem ser atualizados a qualquer momento para aprimorar a formação.</p>
      </LegalArticle>
    </PublicShell>
  );
}
