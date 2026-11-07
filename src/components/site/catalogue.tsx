"use client";

import { LayoutGrid, Rows3, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { fmtInt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category, Platform, ServiceView } from "@/types/models";
import { ServiceCard, TIER_LABEL } from "./service-card";

type Sort = "featured" | "price-asc" | "price-desc" | "name";

export function Catalogue({
  platforms,
  categories,
  services,
  initialPlatform = "",
}: {
  platforms: Platform[];
  categories: Category[];
  services: ServiceView[];
  initialPlatform?: string;
}) {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState(initialPlatform);
  const [category, setCategory] = useState("");
  const [tier, setTier] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const [view, setView] = useState<"cards" | "table">("cards");

  const cats = categories.filter((c) => !platform || platforms.find((p) => p.slug === platform)?.id === c.platform_id);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = services.filter(
      (s) =>
        (!platform || s.platform_slug === platform) &&
        (!category || s.category_id === category) &&
        (!tier || s.quality_tier === tier) &&
        (!term || `${s.name} ${s.category_name} ${s.platform_name}`.toLowerCase().includes(term)),
    );
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price_per_1000_usd - b.price_per_1000_usd);
    if (sort === "price-desc") sorted.sort((a, b) => b.price_per_1000_usd - a.price_per_1000_usd);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "featured") sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
    return sorted;
  }, [services, q, platform, category, tier, sort]);

  const filtered = Boolean(q || platform || category || tier);
  const reset = () => { setQ(""); setPlatform(""); setCategory(""); setTier(""); };

  return (
    <div data-platform={platform || undefined}>
      <div className="grid gap-3 rounded-lg border border-border bg-surface p-4 md:grid-cols-12 md:items-end">
        <div className="relative md:col-span-4">
          <label htmlFor="cat-q" className="sr-only">Search services</label>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input id="cat-q" type="search" placeholder="Search services" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <FilterSelect label="Platform" className="md:col-span-2" value={platform} onChange={(v) => { setPlatform(v); setCategory(""); }}
          options={[["", "All platforms"], ...platforms.map((p) => [p.slug, p.name] as [string, string])]} />
        <FilterSelect label="Category" className="md:col-span-2" value={category} onChange={setCategory}
          options={[["", "All categories"], ...cats.map((c) => [c.id, `${platforms.find((p) => p.id === c.platform_id)?.name ?? ""} · ${c.name}`] as [string, string])]} />
        <FilterSelect label="Quality" className="md:col-span-2" value={tier} onChange={setTier}
          options={[["", "Any quality"], ...Object.entries(TIER_LABEL)]} />
        <FilterSelect label="Sort" className="md:col-span-2" value={sort} onChange={(v) => setSort(v as Sort)}
          options={[["featured", "Popular first"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["name", "Name"]]} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted" aria-live="polite">
          {results.length} service{results.length === 1 ? "" : "s"}
          {filtered && <button type="button" onClick={reset} className="ml-3 inline-flex min-h-11 cursor-pointer items-center gap-1 font-semibold text-brand"><X aria-hidden className="size-4" />Clear filters</button>}
        </p>
        <div className="hidden gap-1 sm:flex" role="group" aria-label="View">
          <Button variant={view === "cards" ? "secondary" : "ghost"} size="icon" aria-pressed={view === "cards"} aria-label="Card view" onClick={() => setView("cards")}><LayoutGrid aria-hidden /></Button>
          <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" aria-pressed={view === "table"} aria-label="Table view" onClick={() => setView("table")}><Rows3 aria-hidden /></Button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border-strong p-10 text-center">
          <p className="font-semibold">No services match these filters.</p>
          <p className="mt-1 text-sm text-fg-muted">Try a different search, or ask us for a custom quote.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="secondary" onClick={reset}>Clear filters</Button>
            <Button asChild><Link href="/contact">Custom quote</Link></Button>
          </div>
        </div>
      ) : view === "cards" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((s) => <ServiceCard key={s.id} s={s} />)}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-surface-2 text-left text-xs text-fg-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Service</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Per 1,000</th>
                <th scope="col" className="px-4 py-3 font-semibold">Min–max</th>
                <th scope="col" className="px-4 py-3 font-semibold">Starts</th>
                <th scope="col" className="px-4 py-3 font-semibold">Refill</th>
                <th scope="col" className="px-4 py-3 font-semibold">Delivery method</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Order</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((s) => (
                <tr key={s.id} data-platform={s.platform_slug} className="align-top hover:bg-surface-2/50">
                  <td className="px-4 py-3">
                    <Link href={`/${s.platform_slug}/${s.slug}`} className="font-semibold text-fg hover:underline">{s.name}</Link>
                    <span className="block text-xs text-fg-subtle">{TIER_LABEL[s.quality_tier]}</span>
                  </td>
                  <td className="px-4 py-3 text-right"><Price usd={s.price_per_1000_usd} className="font-semibold" /></td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{fmtInt(s.min_qty)}–{fmtInt(s.max_qty)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{s.start_time}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{s.refill_days ? `${s.refill_days} days` : "None"}</td>
                  <td className="max-w-xs px-4 py-3 text-fg-muted"><span className="line-clamp-2">{s.delivery_method}</span></td>
                  <td className="px-4 py-3"><Button asChild size="sm" variant="secondary"><Link href={`/order?service=${s.slug}`}>Order</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, className }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; className?: string }) {
  const id = `f-${label.toLowerCase()}`;
  return (
    <div className={cn("grid gap-1", className)}>
      <label htmlFor={id} className="text-xs font-semibold text-fg-muted">{label}</label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </div>
  );
}
