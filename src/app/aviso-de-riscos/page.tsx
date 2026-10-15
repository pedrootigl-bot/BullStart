import type { Metadata } from "next";
import { LegalArticle, PublicShell } from "@/components/public-shell";

export const metadata: Metadata = { title: "Aviso de riscos" };

export default function RiskNoticePage() {
  return (
    <PublicShell>
      <LegalArticle title="Aviso de riscos" updatedAt="13 de outubro de 2026">
        <p>
          Operações no mercado financeiro envolvem riscos significativos, incluindo a possibilidade de perda parcial ou
          total do capital. Instrumentos alavancados ampliam tanto ganhos quanto perdas.
        </p>
        <ul>
          <li>O conteúdo do Bullex Start é exclusivamente educacional e não garante resultados.</li>
          <li>Nenhuma aula constitui recomendação de compra, venda ou manutenção de ativos.</li>
          <li>Resultados passados, simulações e exemplos não garantem resultados futuros.</li>
          <li>Opere apenas com recursos cuja perda não comprometa sua situação financeira.</li>
          <li>Depósitos e operações são realizados exclusivamente nos ambientes oficiais da corretora.</li>
        </ul>
      </LegalArticle>
    </PublicShell>
  );
}
