import type { Metadata } from "next";
import { LegalArticle, PublicShell } from "@/components/public-shell";

export const metadata: Metadata = { title: "Política de Privacidade" };

export default function PrivacyPage() {
  return (
    <PublicShell>
      <LegalArticle title="Política de Privacidade" updatedAt="13 de outubro de 2026">
        <p>
          Esta política descreve como o Bullex Start trata dados pessoais de alunos, em conformidade com a Lei Geral de
          Proteção de Dados (Lei nº 13.709/2018).
        </p>
        <h2>Dados tratados</h2>
        <ul>
          <li>Dados de cadastro: nome, e-mail e credenciais de acesso (a senha é armazenada apenas de forma criptografada).</li>
          <li>Dados educacionais: aulas iniciadas e concluídas, posição de reprodução e certificados emitidos.</li>
          <li>
            Dados de vínculo com a corretora: identificador oficial do cliente, status da conta e status de elegibilidade
            para requisitos de acesso. Valores financeiros não são armazenados.
          </li>
          <li>Registros técnicos de segurança, como endereço IP para limitação de tentativas de acesso.</li>
        </ul>
        <h2>Finalidades</h2>
        <p>
          Prestar o serviço educacional, liberar módulos conforme as regras de acesso, emitir e permitir a verificação de
          certificados, prevenir fraudes e cumprir obrigações legais.
        </p>
        <h2>Compartilhamento</h2>
        <p>
          Dados de vínculo e elegibilidade são trocados com a Bullex exclusivamente por canais oficiais e autenticados. A
          verificação pública de certificados exibe apenas primeiro nome, inicial do sobrenome, programa e datas.
        </p>
        <h2>Direitos do titular</h2>
        <p>
          Você pode solicitar confirmação, acesso, correção, anonimização ou exclusão dos seus dados pelos canais de
          atendimento oficiais da Bullex.
        </p>
      </LegalArticle>
    </PublicShell>
  );
}
