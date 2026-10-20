import { LineCapStyle, PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  MEDAL_ARROW_PATH,
  MEDAL_RADII,
  MEDAL_TREND_PATH,
  MEDAL_VIEWBOX,
  RIBBON_LEFT_FOLD_PATH,
  RIBBON_LEFT_PATH,
  RIBBON_RIGHT_FOLD_PATH,
  RIBBON_RIGHT_PATH,
  circlePath,
  laurelLeafPaths,
  rosettePath,
} from "@/lib/certificates/medal";

export type CertificatePdfInput = {
  holderName: string;
  programName: string;
  completedAt: Date;
  workloadHours: number;
};

const INK = rgb(0.027, 0.035, 0.031);
const GREEN = rgb(0.122, 0.847, 0.467);
const GREEN_LIGHT = rgb(0.275, 0.922, 0.576);
const GREEN_DEEP = rgb(0.04, 0.42, 0.23);
const GREEN_SHADOW = rgb(0.024, 0.3, 0.16);
const GOLD = rgb(0.886, 0.753, 0.416);
const GOLD_LIGHT = rgb(0.941, 0.851, 0.6);
const GOLD_DEEP = rgb(0.66, 0.51, 0.18);
const DISC = rgb(0.07, 0.09, 0.08);
const WHITE = rgb(0.957, 0.969, 0.965);
const MUTED = rgb(0.56, 0.62, 0.6);

function centerText(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = WHITE, cx = page.getWidth() / 2) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: cx - width / 2, y, size, font, color });
}

function fitSize(text: string, font: PDFFont, maxWidth: number, preferred: number, min: number) {
  let size = preferred;
  while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1;
  return size;
}

export function formatDatePtBr(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function drawAtmosphere(page: PDFPage, width: number, height: number) {
  for (let size = 340; size > 20; size -= 16) {
    page.drawCircle({ x: 0, y: height, size, color: GREEN, opacity: 0.008 });
    page.drawCircle({ x: width, y: 0, size, color: GOLD, opacity: 0.008 });
  }
}

function drawCornerOrnaments(page: PDFPage, width: number, height: number) {
  const inset = 44;
  const long = 34;
  const short = 22;
  const corners = [
    { x: inset, y: height - inset, sx: 1, sy: -1 },
    { x: width - inset, y: height - inset, sx: -1, sy: -1 },
    { x: inset, y: inset, sx: 1, sy: 1 },
    { x: width - inset, y: inset, sx: -1, sy: 1 },
  ];
  for (const { x, y, sx, sy } of corners) {
    page.drawLine({ start: { x, y }, end: { x: x + long * sx, y }, thickness: 1.2, color: GOLD });
    page.drawLine({ start: { x, y }, end: { x, y: y + long * sy }, thickness: 1.2, color: GOLD });
    page.drawLine({ start: { x: x + 6 * sx, y: y + 6 * sy }, end: { x: x + short * sx, y: y + 6 * sy }, thickness: 0.6, color: GOLD, opacity: 0.6 });
    page.drawLine({ start: { x: x + 6 * sx, y: y + 6 * sy }, end: { x: x + 6 * sx, y: y + short * sy }, thickness: 0.6, color: GOLD, opacity: 0.6 });
    page.drawSvgPath("M0 -3 L3 0 L0 3 L-3 0 Z", { x, y, color: GOLD });
  }
}

function drawDivider(page: PDFPage, cx: number, y: number, halfWidth: number) {
  page.drawLine({ start: { x: cx - halfWidth, y }, end: { x: cx - 8, y }, thickness: 0.7, color: GOLD, opacity: 0.8 });
  page.drawLine({ start: { x: cx + 8, y }, end: { x: cx + halfWidth, y }, thickness: 0.7, color: GOLD, opacity: 0.8 });
  page.drawSvgPath("M0 -3.5 L3.5 0 L0 3.5 L-3.5 0 Z", { x: cx, y, color: GOLD });
}

function drawMedal(page: PDFPage, cx: number, bottom: number, scale: number) {
  const x = cx - (MEDAL_VIEWBOX.width / 2) * scale;
  const y = bottom + MEDAL_VIEWBOX.height * scale;
  const at = { x, y, scale };

  page.drawSvgPath(RIBBON_LEFT_PATH, { ...at, color: GREEN_DEEP });
  page.drawSvgPath(RIBBON_RIGHT_PATH, { ...at, color: GREEN_DEEP });
  page.drawSvgPath(RIBBON_LEFT_FOLD_PATH, { ...at, color: GREEN_SHADOW });
  page.drawSvgPath(RIBBON_RIGHT_FOLD_PATH, { ...at, color: GREEN_SHADOW });

  page.drawSvgPath(rosettePath(), { ...at, color: GOLD });
  page.drawSvgPath(circlePath(MEDAL_RADII.ring), { ...at, color: GOLD_DEEP });
  page.drawSvgPath(circlePath(MEDAL_RADII.face), { ...at, color: GOLD_LIGHT });
  page.drawSvgPath(circlePath(MEDAL_RADII.disc), { ...at, color: DISC, borderColor: GOLD_LIGHT, borderWidth: 1.2 });

  for (const leaf of laurelLeafPaths()) page.drawSvgPath(leaf, { ...at, color: GOLD });

  const stroke = { ...at, borderWidth: 3, borderLineCap: LineCapStyle.Round };
  page.drawSvgPath(MEDAL_TREND_PATH, { ...stroke, borderColor: GREEN_LIGHT });
  page.drawSvgPath(MEDAL_ARROW_PATH, { ...stroke, borderColor: GOLD_LIGHT });
}

function drawSignatureColumn(
  page: PDFPage,
  cx: number,
  y: number,
  value: string,
  label: string,
  valueFont: PDFFont,
  labelFont: PDFFont,
) {
  const valueSize = fitSize(value, valueFont, 200, 14, 9);
  centerText(page, value, y + 10, valueFont, valueSize, WHITE, cx);
  page.drawLine({ start: { x: cx - 95, y }, end: { x: cx + 95, y }, thickness: 0.7, color: GOLD, opacity: 0.8 });
  centerText(page, label.toUpperCase(), y - 16, labelFont, 7.5, MUTED, cx);
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
  const cx = width / 2;
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);

  page.drawRectangle({ x: 0, y: 0, width, height, color: INK });
  drawAtmosphere(page, width, height);

  page.drawRectangle({ x: 26, y: 26, width: width - 52, height: height - 52, borderColor: GOLD, borderWidth: 1.3 });
  page.drawRectangle({ x: 34, y: 34, width: width - 68, height: height - 68, borderColor: GOLD, borderWidth: 0.5, borderOpacity: 0.35 });
  drawCornerOrnaments(page, width, height);

  const markSize = 30;
  const markX = cx - markSize / 2;
  const markY = height - 100;
  page.drawRectangle({ x: markX, y: markY, width: markSize, height: markSize, color: DISC, borderColor: WHITE, borderWidth: 0.3, borderOpacity: 0.3 });
  page.drawSvgPath("M7 21 L12.5 15 L16.5 18 L24 9", {
    x: markX,
    y: markY + markSize,
    borderColor: GREEN,
    borderWidth: 2.2,
    borderLineCap: LineCapStyle.Round,
  });
  page.drawSvgPath("M19.5 9 H24 V13.5", {
    x: markX,
    y: markY + markSize,
    borderColor: GOLD,
    borderWidth: 2.2,
    borderLineCap: LineCapStyle.Round,
  });

  const brandSize = 16;
  const brandX = cx - bold.widthOfTextAtSize("BULLEX START", brandSize) / 2;
  page.drawText("BULLEX ", { x: brandX, y: height - 124, size: brandSize, font: bold, color: WHITE });
  page.drawText("START", { x: brandX + bold.widthOfTextAtSize("BULLEX ", brandSize), y: height - 124, size: brandSize, font: bold, color: GREEN });

  const program = input.programName.toUpperCase();
  const programWidth = regular.widthOfTextAtSize(program, 8.5);
  centerText(page, program, height - 143, regular, 8.5, MUTED);
  page.drawLine({ start: { x: cx - programWidth / 2 - 40, y: height - 140 }, end: { x: cx - programWidth / 2 - 10, y: height - 140 }, thickness: 0.7, color: GOLD });
  page.drawLine({ start: { x: cx + programWidth / 2 + 10, y: height - 140 }, end: { x: cx + programWidth / 2 + 40, y: height - 140 }, thickness: 0.7, color: GOLD });

  centerText(page, "Certificado de Conclusão", height - 200, serifBold, 38, GOLD_LIGHT);
  centerText(page, "Certificamos que", height - 234, regular, 11.5, MUTED);

  const nameSize = fitSize(input.holderName, serifBold, width - 200, 42, 18);
  centerText(page, input.holderName, height - 284, serifBold, nameSize, GOLD);
  drawDivider(page, cx, height - 302, 150);

  centerText(page, `concluiu o programa educacional ${input.programName},`, height - 332, regular, 12, WHITE);
  centerText(page, `com carga horária de ${input.workloadHours} horas.`, height - 350, regular, 12, WHITE);

  drawMedal(page, cx, 62, 0.95);

  drawSignatureColumn(page, 205, 126, formatDatePtBr(input.completedAt), "Data de conclusão", bold, regular);
  drawSignatureColumn(page, width - 205, 126, "Bullex Academy", "Emissor", serifItalic, regular);

  centerText(
    page,
    "Certificado de conclusão de conteúdo educacional. Não constitui habilitação profissional ou licença regulatória.",
    42,
    regular,
    6.5,
    MUTED,
  );

  return pdf.save();
}
