import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";

export type CertificatePdfInput = {
  holderName: string;
  programName: string;
  completedAt: Date;
  workloadHours: number;
  verificationCode: string;
  verificationUrl: string;
};

const INK = rgb(0.035, 0.043, 0.047);
const GRAPHITE = rgb(0.09, 0.105, 0.115);
const GREEN = rgb(0.133, 0.878, 0.478);
const GOLD = rgb(0.851, 0.725, 0.384);
const WHITE = rgb(0.96, 0.97, 0.97);
const MUTED = rgb(0.62, 0.66, 0.68);

function centerText(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = WHITE) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - width) / 2, y, size, font, color });
}

function fitSize(text: string, font: PDFFont, maxWidth: number, preferred: number, min: number) {
  let size = preferred;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

export function formatDatePtBr(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(date);
}

/** Certificado A4 paisagem com identidade Bullex Start. Fontes padrão (WinAnsi) cobrem acentuação pt-BR. */
export async function renderCertificatePdf(input: CertificatePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificado Bullex Start — ${input.holderName}`);
  pdf.setAuthor("Bullex Start");
  pdf.setSubject(input.programName);
  pdf.setCreator("Bullex Start");

  const page = pdf.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x: 0, y: 0, width, height, color: INK });
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: GOLD, borderWidth: 0.8, color: GRAPHITE });
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: rgb(0.2, 0.22, 0.23), borderWidth: 0.5 });
  page.drawRectangle({ x: 34, y: height - 40, width: width - 68, height: 6, color: GREEN });

  centerText(page, "BULLEX START", height - 98, bold, 22, GREEN);
  centerText(page, "FORMAÇÃO TRADER BULLEX", height - 120, regular, 10, MUTED);
  centerText(page, "CERTIFICADO DE CONCLUSÃO", height - 175, bold, 30, WHITE);
  centerText(page, "Certificamos que", height - 220, regular, 13, MUTED);

  const nameSize = fitSize(input.holderName, bold, width - 160, 34, 18);
  centerText(page, input.holderName, height - 268, bold, nameSize, GOLD);
  page.drawLine({ start: { x: width / 2 - 180, y: height - 282 }, end: { x: width / 2 + 180, y: height - 282 }, thickness: 0.6, color: GOLD });

  centerText(page, `concluiu o programa educacional ${input.programName},`, height - 316, regular, 13, WHITE);
  centerText(
    page,
    `com carga horária de ${input.workloadHours} horas, em ${formatDatePtBr(input.completedAt)}.`,
    height - 336,
    regular,
    13,
    WHITE,
  );
  centerText(
    page,
    "Certificado de conclusão de conteúdo educacional. Não constitui habilitação profissional ou licença regulatória.",
    height - 372,
    regular,
    8.5,
    MUTED,
  );

  const qrPng = await QRCode.toBuffer(input.verificationUrl, { margin: 1, width: 220, color: { dark: "#0a0c0dff", light: "#f4f6f6ff" } });
  const qrImage = await pdf.embedPng(qrPng);
  page.drawImage(qrImage, { x: width - 162, y: 64, width: 92, height: 92 });

  page.drawText("Código de validação", { x: 72, y: 128, size: 9, font: regular, color: MUTED });
  page.drawText(input.verificationCode, { x: 72, y: 108, size: 16, font: bold, color: GREEN });
  page.drawText("Verifique a autenticidade em:", { x: 72, y: 86, size: 9, font: regular, color: MUTED });
  page.drawText(input.verificationUrl, { x: 72, y: 72, size: 9, font: regular, color: WHITE });

  return pdf.save();
}
