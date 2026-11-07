import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/data";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { domain } = await getSiteSettings();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/order", "/track", "/privacy/request"] },
    sitemap: `https://${domain}/sitemap.xml`,
  };
}
