import { ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/shared/json-ld";
import { Price } from "@/components/shared/price";
import { Container } from "@/components/shared/section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPackageBySlug, getSiteSettings } from "@/lib/data";
import { fmtInt } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPackageBySlug((await params).slug);
  if (!p) return {};
  return { title: `${p.name} package`, description: p.tagline ?? undefined, alternates: { canonical: `/packages/${p.slug}` } };
}

export default async function PackagePage({ params }: Props) {
  const [p, settings] = await Promise.all([getPackageBySlug((await params).slug), getSiteSettings()]);
  if (!p) notFound();
  const saving = p.compare_at_price_usd ? p.compare_at_price_usd - p.price_usd : 0;
  return (
    <div data-platform={p.platform_slug}>
      <Container className="grid gap-10 py-10 md:py-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Link href="/packages" className="inline-flex min-h-11 items-center text-sm text-fg-muted hover:text-fg">← All packages</Link>
          <p className="mt-2 text-overline font-semibold text-accent uppercase">{p.platform_name} package</p>
          <h1 className="mt-3 flex flex-wrap items-center gap-3 font-display text-display-xl font-semibold">{p.name} {p.badge && <Badge>{p.badge}</Badge>}</h1>
          {p.tagline && <p className="mt-4 text-lg text-fg-muted">{p.tagline}</p>}
          <h2 className="mt-10 font-display text-xl font-semibold">What&rsquo;s included</h2>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
            {p.resolved.map(({ service, qty }) => (
              <li key={service.id} className="p-4">
                <p className="flex items-start gap-2.5 font-semibold">
                  <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span><span className="font-mono">{fmtInt(qty)}</span> × <Link href={`/${service.platform_slug}/${service.slug}`} className="underline-offset-2 hover:underline">{service.name}</Link></span>
                </p>
                <p className="mt-1 pl-7 text-sm text-fg-muted">Starts {service.start_time} · {service.refill_days ? `${service.refill_days}-day refill` : "no refill"}</p>
                <p className="mt-1 pl-7 text-sm text-fg-muted">{service.delivery_method}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-fg-muted">Each part is delivered to the link you provide. Platforms may remove engagement; results are not guaranteed beyond each service&rsquo;s refill period.</p>
        </div>
        <aside className="lg:col-span-5">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-2 lg:sticky lg:top-24">
            <p className="text-sm text-fg-muted">Package price</p>
            <Price usd={p.price_usd} className="mt-1 block text-4xl font-semibold" />
            {saving > 0.005 && p.compare_at_price_usd && (
              <p className="mt-2 text-sm text-fg-muted">
                <Price usd={p.compare_at_price_usd} className="line-through" /> if bought separately · <span className="font-semibold text-success">save <Price usd={saving} /></span>
              </p>
            )}
            <Button asChild size="lg" className="mt-6 w-full"><Link href={`/order?package=${p.slug}`}>Order this package <ArrowRight aria-hidden /></Link></Button>
            <p className="mt-3 text-center text-xs text-fg-subtle">No password needed. Payment details are emailed after ordering.</p>
          </div>
        </aside>
      </Container>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Product", name: `${p.name} package`, description: p.tagline ?? p.name,
        brand: { "@type": "Brand", name: settings.brand },
        offers: { "@type": "Offer", priceCurrency: "USD", price: p.price_usd.toFixed(2), availability: "https://schema.org/InStock", url: `https://${settings.domain}/packages/${p.slug}` },
      }} />
    </div>
  );
}
