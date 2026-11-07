import { ArrowRight, Link2, ListChecks, Mail, RefreshCcw, ShieldCheck, Clock3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { FaqList } from "@/components/shared/faq-list";
import { LocalHours } from "@/components/shared/local-time";
import { Reveal } from "@/components/shared/reveal";
import { Container } from "@/components/shared/section";
import { PlatformShowcase } from "@/components/site/platform-showcase";
import { PriceCalculator } from "@/components/site/price-calculator";
import { Button } from "@/components/ui/button";
import { getBanners, getCatalog, getFaqs, getSiteSettings, getTestimonials } from "@/lib/data";
import { fmtInt } from "@/lib/format";

const STEPS = [
  { icon: ListChecks, title: "Pick a service", body: "Choose a service or bundle and a quantity. The price, start time and refill period are shown before you commit." },
  { icon: Link2, title: "Paste a public link", body: "Your profile, post or video link. We never need your password or account access." },
  { icon: Mail, title: "Pay and track", body: "We email payment details. Once paid, your order starts and you can track it with your order code." },
];

export default async function HomePage() {
  const country = (await headers()).get("x-vercel-ip-country");
  const [catalog, settings, faqs, testimonials, banners] = await Promise.all([
    getCatalog(), getSiteSettings(), getFaqs(), getTestimonials(), getBanners("home_hero", country),
  ]);
  const banner = banners[0];
  const maxRefill = Math.max(0, ...catalog.services.map((s) => s.refill_days));

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Container className="grid gap-10 pt-12 pb-16 md:pt-16 lg:grid-cols-12 lg:gap-12 lg:pt-20 lg:pb-24">
          <div className="lg:col-span-6 lg:pt-6">
            <p className="text-overline font-semibold text-brand uppercase">YouTube &amp; Instagram growth</p>
            <h1 className="mt-4 font-display text-display-2xl font-semibold text-balance">
              {banner?.title ?? "Grow your channel with prices you can read before you pay."}
            </h1>
            <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-pretty text-fg-muted">
              {banner?.subtitle ??
                "Every service shows its per-1,000 price in your currency, when it starts, how fast it delivers, its refill period, and in plain language how the engagement is delivered."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={banner?.cta_link || "/services"}>
                  {banner?.cta_text || "Browse services"} <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Get a custom quote</Link>
              </Button>
            </div>
            {banner?.image_url && (
              <div className="relative mt-10 aspect-[16/7] overflow-hidden rounded-lg border border-border">
                <picture>
                  {banner.mobile_image_url && <source media="(max-width: 767px)" srcSet={banner.mobile_image_url} />}
                  <Image src={banner.image_url} alt="" fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" unoptimized />
                </picture>
              </div>
            )}
          </div>
          <div className="lg:col-span-6">
            <PriceCalculator platforms={catalog.platforms} services={catalog.services} />
          </div>
        </Container>
      </section>

      {/* Popular, by platform */}
      <section aria-labelledby="popular" className="border-t border-border bg-surface/40 py-16 md:py-24">
        <Container>
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="popular" className="font-display text-display-lg font-semibold">Popular packages</h2>
                <p className="mt-2 text-fg-muted">Bundles cost less than buying each service separately.</p>
              </div>
              <Link href="/packages" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand hover:underline">
                Compare all packages <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </Reveal>
          <div className="mt-8">
            <PlatformShowcase platforms={catalog.platforms} services={catalog.services} packages={catalog.packages} />
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="py-16 md:py-24">
        <Container>
          <Reveal><h2 id="how" className="font-display text-display-lg font-semibold">How it works</h2></Reveal>
          <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.06}>
                <li className="border-t-2 border-fg pt-5">
                  <span className="font-mono text-sm text-fg-subtle">0{i + 1}</span>
                  <div className="mt-3 flex items-center gap-3">
                    <s.icon aria-hidden className="size-6 text-brand" />
                    <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                  </div>
                  <p className="mt-2 leading-relaxed text-fg-muted">{s.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      {/* Trust */}
      <section aria-labelledby="trust" className="border-y border-border bg-surface py-16 md:py-24">
        <Container>
          <Reveal>
            <h2 id="trust" className="max-w-[24ch] font-display text-display-lg font-semibold text-balance">Clear policies, before you order</h2>
          </Reveal>
          {settings.stats.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
              {settings.stats.map((s) => (
                <div key={s.label}>
                  <dt className="text-sm text-fg-muted">{s.label}</dt>
                  <dd className="mt-1 font-mono text-3xl font-semibold tabular-nums">{fmtInt(s.value)}{s.suffix}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <Reveal>
              <RefreshCcw aria-hidden className="size-6 text-brand" />
              <h3 className="mt-3 font-semibold">Refill guarantee</h3>
              <p className="mt-1.5 text-fg-muted">If a count drops during a service&rsquo;s refill period{maxRefill ? ` (up to ${maxRefill} days)` : ""}, we top it up free. <Link href="/legal/refund-refill" className="font-medium text-brand underline underline-offset-2">Refund &amp; refill policy</Link></p>
            </Reveal>
            <Reveal delay={0.06}>
              <ShieldCheck aria-hidden className="size-6 text-brand" />
              <h3 className="mt-3 font-semibold">No passwords, ever</h3>
              <p className="mt-1.5 text-fg-muted">We only need a public link. Every service states how its engagement is delivered, and that platforms may remove engagement over time.</p>
            </Reveal>
            <Reveal delay={0.12}>
              <Clock3 aria-hidden className="size-6 text-brand" />
              <h3 className="mt-3 font-semibold">Human support</h3>
              <p className="mt-1.5 text-fg-muted">
                <LocalHours {...settings.support_hours} />. Payment details are emailed after you order.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Testimonials: real customers only, hidden when there are none */}
      {testimonials.length > 0 && (
        <section aria-labelledby="reviews" className="py-16 md:py-24">
          <Container>
            <h2 id="reviews" className="font-display text-display-lg font-semibold">What customers say</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.slice(0, 6).map((t) => (
                <figure key={t.id} className="rounded-lg border border-border bg-surface p-6">
                  {t.rating && <p className="text-sm font-semibold text-fg" aria-label={`${t.rating} out of 5`}>{"★".repeat(t.rating)}<span className="text-border-strong">{"★".repeat(5 - t.rating)}</span></p>}
                  <blockquote className="mt-3 leading-relaxed text-fg">&ldquo;{t.text}&rdquo;</blockquote>
                  <figcaption className="mt-4 text-sm text-fg-muted">
                    <span className="font-semibold text-fg">{t.name}</span>
                    {t.role_company && `, ${t.role_company}`}
                    {t.country && ` · ${t.country}`}
                    {t.verified && t.source_url && (
                      <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="ml-1 font-medium text-brand underline underline-offset-2">Verified source</a>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* FAQ */}
      <section aria-labelledby="faq" className="py-16 md:py-24">
        <Container className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 id="faq" className="font-display text-display-lg font-semibold">Questions</h2>
            <p className="mt-3 text-fg-muted">Can&rsquo;t find an answer? <Link href="/contact" className="font-medium text-brand underline underline-offset-2">Ask us</Link>.</p>
          </div>
          <div className="lg:col-span-8">
            <FaqList faqs={faqs.slice(0, 6)} />
            <Link href="/faq" className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand hover:underline">All questions <ArrowRight aria-hidden className="size-4" /></Link>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="pb-8">
        <Container>
          <div className="rounded-lg bg-fg px-6 py-12 text-bg md:px-12 md:py-16">
            <h2 className="max-w-[20ch] font-display text-display-lg font-semibold text-balance">Ready when you are. See the price first.</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-bg text-fg hover:bg-surface-2"><Link href="/services">Browse services</Link></Button>
              <Button asChild size="lg" variant="ghost" className="text-bg hover:bg-bg/10"><Link href="/contact">Agency or large order? Get a quote</Link></Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
