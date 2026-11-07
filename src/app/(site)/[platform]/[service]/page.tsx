import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/shared/json-ld";
import { Markdown } from "@/components/shared/markdown";
import { Container } from "@/components/shared/section";
import { ServiceCard, TIER_LABEL } from "@/components/site/service-card";
import { ServiceOrderBox } from "@/components/site/service-order-box";
import { getCatalog, getServiceBySlug, getSiteSettings } from "@/lib/data";
import { fmtInt } from "@/lib/format";

type Props = { params: Promise<{ platform: string; service: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { platform, service } = await params;
  const s = await getServiceBySlug(service);
  if (!s || s.platform_slug !== platform) return {};
  return {
    title: s.name,
    description: `${s.name}: $${s.price_per_1000_usd.toFixed(2)} per 1,000, starts ${s.start_time}, ${s.refill_days ? `${s.refill_days}-day refill` : "no refill"}. ${s.delivery_method.slice(0, 90)}`,
    alternates: { canonical: `/${platform}/${service}` },
  };
}

export default async function ServicePage({ params }: Props) {
  const { platform, service } = await params;
  const [s, catalog, settings] = await Promise.all([getServiceBySlug(service), getCatalog(), getSiteSettings()]);
  if (!s || s.platform_slug !== platform) notFound();
  const related = catalog.services.filter((x) => x.category_id === s.category_id && x.id !== s.id).slice(0, 3);

  const timeline = [
    { t: "Right after ordering", d: "You get an order code by email, with payment details." },
    { t: "After payment", d: `We record your current count, then start within ${s.start_time}.` },
    { t: "Delivery", d: `Delivered gradually at about ${s.speed}.` },
    { t: "Afterwards", d: s.refill_days ? `If the count drops within ${s.refill_days} days, we refill it free.` : "This service has no refill period." },
  ];

  return (
    <div data-platform={s.platform_slug}>
      <Container className="py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/services" className="inline-flex min-h-11 items-center hover:text-fg">Services</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={`/${s.platform_slug}`} className="inline-flex min-h-11 items-center hover:text-fg">{s.platform_name}</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-fg">{s.category_name}</li>
          </ol>
        </nav>

        <div className="mt-4 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="text-overline font-semibold text-accent uppercase">{s.platform_name} · {TIER_LABEL[s.quality_tier]}</p>
            <h1 className="mt-3 font-display text-display-xl font-semibold text-balance">{s.name}</h1>
            {s.description && <Markdown source={s.description} className="mt-2 text-lg" />}

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
              {[
                ["Starts", s.start_time],
                ["Speed", s.speed],
                ["Refill", s.refill_days ? `${s.refill_days} days` : "None"],
                ["Order size", `${fmtInt(s.min_qty)}–${fmtInt(s.max_qty)}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-surface p-4">
                  <dt className="text-xs font-semibold text-fg-subtle uppercase">{k}</dt>
                  <dd className="mt-1 text-sm font-semibold text-fg">{v}</dd>
                </div>
              ))}
            </dl>

            <section aria-labelledby="delivery" className="mt-10 rounded-lg border border-border bg-surface p-5">
              <h2 id="delivery" className="flex items-center gap-2 font-semibold"><Info aria-hidden className="size-5 text-info" />How this is delivered</h2>
              <p className="mt-2 leading-relaxed text-fg-muted">{s.delivery_method}</p>
              {s.geo_targeting && <p className="mt-2 text-sm text-fg-muted">Targeting: {s.geo_targeting}</p>}
            </section>

            {s.requirements.length > 0 && (
              <section aria-labelledby="req" className="mt-8">
                <h2 id="req" className="font-display text-xl font-semibold">Before you order</h2>
                <ul className="mt-3 space-y-2">
                  {s.requirements.map((r) => (
                    <li key={r} className="flex gap-2.5 text-fg-muted"><CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />{r}</li>
                  ))}
                  <li className="flex gap-2.5 text-fg-muted"><CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-brand" />Never share your password. We only need the public link.</li>
                </ul>
              </section>
            )}

            <section aria-labelledby="expect" className="mt-10">
              <h2 id="expect" className="font-display text-xl font-semibold">What to expect</h2>
              <ol className="mt-4 border-l-2 border-border pl-6">
                {timeline.map((step) => (
                  <li key={step.t} className="relative pb-6 last:pb-0">
                    <span aria-hidden className="absolute top-1.5 -left-[31px] size-3 rounded-full border-2 border-accent bg-bg" />
                    <p className="font-semibold text-fg">{step.t}</p>
                    <p className="text-fg-muted">{step.d}</p>
                  </li>
                ))}
              </ol>
            </section>

            <p className="mt-8 flex gap-2.5 rounded-lg bg-surface-2 p-4 text-sm text-fg-muted">
              <AlertTriangle aria-hidden className="size-5 shrink-0 text-warning" />
              Platforms may remove engagement at any time. Results are not guaranteed beyond the refill period. {s.guarantee_text}
            </p>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <ServiceOrderBox service={s} />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related" className="mt-20">
            <h2 id="related" className="font-display text-2xl font-semibold">Related services</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <ServiceCard key={r.id} s={r} />)}</div>
          </section>
        )}
      </Container>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: s.name,
          description: s.delivery_method,
          brand: { "@type": "Brand", name: settings.brand },
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: ((s.price_per_1000_usd * s.min_qty) / 1000).toFixed(2),
            eligibleQuantity: { "@type": "QuantitativeValue", minValue: s.min_qty, maxValue: s.max_qty },
            availability: "https://schema.org/InStock",
            url: `https://${settings.domain}/${s.platform_slug}/${s.slug}`,
          },
        }}
      />
    </div>
  );
}
