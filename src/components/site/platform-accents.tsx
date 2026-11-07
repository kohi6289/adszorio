import { ensureContrast } from "@/lib/color";
import type { Platform } from "@/types/models";

/**
 * Accent colours for every platform, from the DB (so a platform added in admin gets its colour),
 * adjusted to meet 4.5:1 contrast on the light and dark backgrounds. The Instagram gradient stays in CSS.
 */
export function PlatformAccents({ platforms }: { platforms: Platform[] }) {
  const css = platforms
    .filter((p) => /^[a-z0-9-]+$/.test(p.slug) && /^#[0-9a-f]{6}$/i.test(p.brand_color))
    .map((p) => {
      const light = ensureContrast(p.brand_color, "#FAFAF7");
      const dark = ensureContrast(p.brand_color, "#0C0D10");
      return `[data-platform="${p.slug}"]{--accent:${light}}.dark [data-platform="${p.slug}"],.dark[data-platform="${p.slug}"]{--accent:${dark}}`;
    })
    .join("");
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
