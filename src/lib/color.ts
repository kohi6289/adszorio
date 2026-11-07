// Contrast helpers for admin-supplied platform colours (WCAG 2.x relative luminance).

const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => channel(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");

/** Darken (light bg) or lighten (dark bg) a colour until it reaches `min` contrast against `bg`. */
export function ensureContrast(fg: string, bg: string, min = 4.5): string {
  let [r, g, b] = rgb(fg);
  const lighten = luminance(bg) < 0.5;
  for (let i = 0; i < 40 && contrast(`#${toHex(r)}${toHex(g)}${toHex(b)}`, bg) < min; i++) {
    const f = lighten ? 1.06 : 0.94;
    [r, g, b] = lighten ? [r * f + 6, g * f + 6, b * f + 6] : [r * f, g * f, b * f];
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
