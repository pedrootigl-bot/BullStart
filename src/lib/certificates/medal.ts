/**
 * Geometria da medalha do certificado em coordenadas SVG (viewBox 0 0 120 150, y para baixo).
 * Compartilhada pelo mockup (SVG) e pelo PDF (pdf-lib `drawSvgPath`).
 */
export const MEDAL_VIEWBOX = { width: 120, height: 150 } as const;
export const MEDAL_CENTER = { x: 60, y: 58 } as const;

const round = (value: number) => Math.round(value * 100) / 100;

export const MEDAL_RADII = { rosetteOuter: 47, rosetteInner: 43, ring: 40, face: 36, disc: 29 } as const;

export function rosettePath(points = 30): string {
  const { x, y } = MEDAL_CENTER;
  const parts: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? MEDAL_RADII.rosetteOuter : MEDAL_RADII.rosetteInner;
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    parts.push(`${i === 0 ? "M" : "L"}${round(x + Math.cos(angle) * radius)} ${round(y + Math.sin(angle) * radius)}`);
  }
  return `${parts.join(" ")} Z`;
}

export function circlePath(radius: number): string {
  const { x, y } = MEDAL_CENTER;
  return `M${x - radius} ${y} A${radius} ${radius} 0 1 0 ${x + radius} ${y} A${radius} ${radius} 0 1 0 ${x - radius} ${y} Z`;
}

export const RIBBON_LEFT_PATH = "M45 86 L62 92 L51 148 L41.5 137 L30 145 Z";
export const RIBBON_RIGHT_PATH = "M75 86 L58 92 L69 148 L78.5 137 L90 145 Z";
export const RIBBON_LEFT_FOLD_PATH = "M45 86 L62 92 L60 101 L44 95 Z";
export const RIBBON_RIGHT_FOLD_PATH = "M75 86 L58 92 L60 101 L76 95 Z";

function leafPath(cx: number, cy: number, angle: number, length: number, width: number): string {
  const dx = Math.cos(angle) * (length / 2);
  const dy = Math.sin(angle) * (length / 2);
  const nx = -Math.sin(angle) * width;
  const ny = Math.cos(angle) * width;
  const t1 = `${round(cx + dx)} ${round(cy + dy)}`;
  const t2 = `${round(cx - dx)} ${round(cy - dy)}`;
  return `M${t2} Q${round(cx + nx)} ${round(cy + ny)} ${t1} Q${round(cx - nx)} ${round(cy - ny)} ${t2} Z`;
}

/** Ramos de louro dos dois lados do disco central, abertos no topo. */
export function laurelLeafPaths(): string[] {
  const { x, y } = MEDAL_CENTER;
  const radius = 23.5;
  const leaves: string[] = [];
  for (let degrees = 112; degrees <= 232; degrees += 15) {
    for (const mirrored of [false, true]) {
      const theta = ((mirrored ? 180 - degrees : degrees) * Math.PI) / 180;
      const cx = x + Math.cos(theta) * radius;
      const cy = y + Math.sin(theta) * radius;
      const tangent = theta + (mirrored ? -Math.PI / 2 : Math.PI / 2) + (mirrored ? 0.35 : -0.35);
      leaves.push(leafPath(cx, cy, tangent, 7.5, 2.1));
    }
  }
  return leaves;
}

export const MEDAL_TREND_PATH = "M47 68 L54 60 L59.5 64.5 L71 51";
export const MEDAL_ARROW_PATH = "M64.5 51 H71 V57.5";
