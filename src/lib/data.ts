import "server-only";
import { cache } from "react";
import * as demo from "@/data/seed";
import { legalPages as demoLegal } from "@/data/legal";
import { hasSupabase } from "@/lib/supabase/env";
import { publicClient } from "@/lib/supabase/public";
import type {
  Banner, Catalog, Category, Currency, Faq, LegalPage, Package, PackageView, Platform, Service, ServiceView, SiteSettings, Testimonial,
} from "@/types/models";

// Public, RLS-limited reads. Every page is rendered per request, so admin edits show up immediately.
// React cache() dedupes calls within a single request.
// Without Supabase env vars (demo mode) the same functions read the built-in sample data instead.

const active = <T extends { is_active?: boolean }>(rows: T[]) => rows.filter((r) => r.is_active !== false);
const bySort = <T extends { sort_order: number }>(rows: T[]) => [...rows].sort((a, b) => a.sort_order - b.sort_order);
const DEMO_PUBLISHED = "2026-11-07T00:00:00Z";

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data as T;
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!hasSupabase()) return demo.siteSettings;
  const row = check<{ data: SiteSettings } | null>(await publicClient().from("site_settings").select("data").eq("id", 1).maybeSingle());
  if (!row) throw new Error("site_settings row missing — run `supabase db reset` to seed.");
  return row.data;
});

export const getCurrencies = cache(async (): Promise<Currency[]> => {
  if (!hasSupabase()) return bySort(active(demo.currencies));
  const rows = check(await publicClient().from("currencies").select("*").order("sort_order"));
  return rows.map((c) => ({ ...c, rate_to_usd: Number(c.rate_to_usd) }));
});

export const getCatalog = cache(async (): Promise<Catalog> => {
  const [platforms, categories, services, packages] = hasSupabase() ? await loadCatalogRows() : [
    bySort(active(demo.platforms)), bySort(demo.categories), bySort(active(demo.services)), bySort(active(demo.packages)),
  ];


  const platformById = new Map(platforms.map((p) => [p.id, p]));
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const serviceViews: ServiceView[] = [];
  for (const s of services) {
    const cat = categoryById.get(s.category_id);
    const plat = cat && platformById.get(cat.platform_id);
    if (!cat || !plat) continue; // category or platform inactive
    serviceViews.push({
      ...s,
      price_per_1000_usd: Number(s.price_per_1000_usd),
      platform_slug: plat.slug,
      platform_name: plat.name,
      category_name: cat.name,
      category_slug: cat.slug,
    });
  }
  const serviceById = new Map(serviceViews.map((s) => [s.id, s]));

  const packageViews: PackageView[] = [];
  for (const p of packages) {
    const plat = platformById.get(p.platform_id);
    if (!plat) continue;
    const resolved = p.items
      .map((it) => ({ service: serviceById.get(it.service_id)!, qty: it.qty }))
      .filter((r) => r.service);
    if (resolved.length !== p.items.length) continue; // a component service was disabled: hide the bundle
    packageViews.push({
      ...p,
      price_usd: Number(p.price_usd),
      compare_at_price_usd: num(p.compare_at_price_usd),
      platform_slug: plat.slug,
      platform_name: plat.name,
      resolved,
    });
  }

  return {
    platforms,
    categories: categories.filter((c) => platformById.has(c.platform_id)),
    services: serviceViews,
    packages: packageViews,
  };
});

function loadCatalogRows() {
  const db = publicClient();
  return Promise.all([
    db.from("platforms").select("*").order("sort_order").then(check<Platform[]>),
    db.from("categories").select("*").order("sort_order").then(check<Category[]>),
    db.from("services").select("*").order("sort_order").then(check<Service[]>),
    db.from("packages").select("*").order("sort_order").then(check<Package[]>),
  ]);
}

export const getPlatforms = cache(async () => (await getCatalog()).platforms);

export async function getPlatform(slug: string) {
  const c = await getCatalog();
  const platform = c.platforms.find((p) => p.slug === slug);
  if (!platform) return null;
  return {
    platform,
    categories: c.categories.filter((x) => x.platform_id === platform.id),
    services: c.services.filter((s) => s.platform_slug === slug),
    packages: c.packages.filter((p) => p.platform_slug === slug),
  };
}

export async function getServiceBySlug(slug: string) {
  return (await getCatalog()).services.find((s) => s.slug === slug) ?? null;
}

export async function getPackageBySlug(slug: string) {
  return (await getCatalog()).packages.find((p) => p.slug === slug) ?? null;
}

export const getFaqs = cache(async (): Promise<Faq[]> =>
  !hasSupabase() ? bySort(demo.faqs) : check(await publicClient().from("faqs").select("*").order("sort_order")),
);

export const getTestimonials = cache(async (): Promise<Testimonial[]> =>
  !hasSupabase() ? [] : check(await publicClient().from("testimonials").select("*").order("sort_order")),
);

export const getBanners = cache(async (placement: Banner["placement"], country: string | null): Promise<Banner[]> => {
  if (!hasSupabase()) return [];
  const rows = check<Banner[]>(await publicClient().from("banners").select("*").eq("placement", placement).order("sort_order"));
  return rows.filter((b) => !b.target_countries?.length || (country && b.target_countries.includes(country)));
});

export const getLegalPage = cache(async (slug: string): Promise<LegalPage | null> =>
  !hasSupabase() ? demoLegalPage(slug) : check(await publicClient().from("legal_pages").select("*").eq("slug", slug).maybeSingle()),
);

export const getLegalPages = cache(async (): Promise<Pick<LegalPage, "slug" | "title">[]> =>
  !hasSupabase() ? demoLegal.map(({ slug, title }) => ({ slug, title })).sort((a, b) => a.slug.localeCompare(b.slug)) : check(await publicClient().from("legal_pages").select("slug,title").order("slug")),
);

function demoLegalPage(slug: string): LegalPage | null {
  const l = demoLegal.find((x) => x.slug === slug);
  return l ? ({ ...l, version: 1, published_at: DEMO_PUBLISHED, updated_at: DEMO_PUBLISHED } as unknown as LegalPage) : null;
}
