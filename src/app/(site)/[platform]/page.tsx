import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaqList } from "@/components/shared/faq-list";
import { Container, PageHeader } from "@/components/shared/section";
import { PackageCard } from "@/components/site/package-card";
import { ServiceCard } from "@/components/site/service-card";
import { getCatalog, getFaqs, getPlatform } from "@/lib/data";

type Props = { params: Promise<{ platform: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPlatform((await params).platform);
  if (!data) return {};
  const name = data.platform.name;
  return {
    title: `${name} growth services and prices`,
    description: `${name} services with transparent per-1,000 pricing, start times, refill periods and plain-language delivery methods.`,
    alternates: { canonical: `/${data.platform.slug}` },
  };
}

export default async function PlatformPage({ params }: Props) {
  const slug = (await params).platform;
  const [data, faqs, catalog] = await Promise.all([getPlatform(slug), getFaqs(), getCatalog()]);
  if (!data) notFound();
  const { platform, categories, services, packages } = data;
  const platformFaqs = faqs.filter((f) => !f.platform_id || f.platform_id === platform.id);

  return (
    <div data-platform={platform.slug}>
      <PageHeader
        eyebrow={platform.name}
        platform={platform.slug}
        title={`${platform.name} growth services`}
        intro={<>Per-1,000 prices in your currency, with a plain-language delivery method on every service. {services.length} services across {categories.length} categories.</>}
      />
      <Container className="py-10 md:py-14">
        <nav aria-label={`${platform.name} categories`} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {categories.map((c) => (
            <a key={c.id} href={`#${c.slug}`} className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-fg-muted hover:text-fg">
              {c.name}
            </a>
          ))}
          {packages.length > 0 && <a href="#packages" className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold text-fg-muted hover:text-fg">Packages</a>}
        </nav>

        {categories.map((c) => {
          const list = services.filter((s) => s.category_id === c.id);
          if (!list.length) return null;
          return (
            <section key={c.id} id={c.slug} aria-labelledby={`h-${c.slug}`} className="scroll-mt-24 pt-12">
              <h2 id={`h-${c.slug}`} className="font-display text-2xl font-semibold">{c.name}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => <ServiceCard key={s.id} s={s} />)}
              </div>
            </section>
          );
        })}

        {packages.length > 0 && (
          <section id="packages" aria-labelledby="h-packages" className="scroll-mt-24 pt-16">
            <h2 id="h-packages" className="font-display text-2xl font-semibold">{platform.name} packages</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {packages.map((p, i) => <PackageCard key={p.id} p={p} highlight={i === 1} />)}
            </div>
          </section>
        )}

        <section aria-labelledby="h-faq" className="mt-16 grid gap-8 lg:grid-cols-12">
          <h2 id="h-faq" className="font-display text-2xl font-semibold lg:col-span-4">Questions</h2>
          <div className="lg:col-span-8"><FaqList faqs={platformFaqs} /></div>
        </section>

        <p className="mt-12 text-sm text-fg-muted">
          Also see: {catalog.platforms.filter((p) => p.slug !== platform.slug).map((p, i) => (
            <span key={p.id}>{i > 0 && ", "}<Link href={`/${p.slug}`} className="font-medium text-brand underline underline-offset-2">{p.name}</Link></span>
          ))}
        </p>
      </Container>
    </div>
  );
}
