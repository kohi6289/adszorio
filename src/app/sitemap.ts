import type { MetadataRoute } from "next";
import { getCatalog, getLegalPages, getSiteSettings } from "@/lib/data";

/** Rebuilt hourly so platforms/services added in the dashboard appear without a redeploy. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ platforms, services, packages }, legal, settings] = await Promise.all([getCatalog(), getLegalPages(), getSiteSettings()]);
  const base = `https://${settings.domain}`;
  const urls = [
    "", "/services", "/packages", "/faq", "/contact",
    ...platforms.map((p) => `/${p.slug}`),
    ...services.map((s) => `/${s.platform_slug}/${s.slug}`),
    ...packages.map((p) => `/packages/${p.slug}`),
    ...legal.map((l) => `/legal/${l.slug}`),
  ];
  return urls.map((u) => ({ url: `${base}${u}`, changeFrequency: "weekly", priority: u === "" ? 1 : 0.7 }));
}
