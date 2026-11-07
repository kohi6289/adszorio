import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { Price } from "@/components/shared/price";
import { Container, PageHeader } from "@/components/shared/section";
import { PackageCard } from "@/components/site/package-card";
import { getCatalog } from "@/lib/data";
import { fmtInt } from "@/lib/format";

export const metadata: Metadata = {
  title: "Packages and bundle pricing",
  description: "Compare YouTube and Instagram bundles. Every bundle costs less than buying its services separately.",
  alternates: { canonical: "/packages" },
};

export default async function PackagesPage() {
  const { platforms, packages } = await getCatalog();
  return (
    <>
      <PageHeader eyebrow="Packages" title="Bundles that cost less than buying separately" intro="The crossed-out price is exactly what the same services would cost one by one." />
      <Container className="py-10 md:py-14">
        {platforms.map((pl) => {
          const list = packages.filter((p) => p.platform_id === pl.id);
          if (!list.length) return null;
          const services = [...new Map(list.flatMap((p) => p.resolved.map((r) => [r.service.id, r.service]))).values()];
          return (
            <section key={pl.id} data-platform={pl.slug} aria-labelledby={`pk-${pl.slug}`} className="pb-16">
              <h2 id={`pk-${pl.slug}`} className="font-display text-display-lg font-semibold">{pl.name}</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {list.map((p, i) => <PackageCard key={p.id} p={p} highlight={i === 1} />)}
              </div>

              <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-surface">
                <table className="w-full min-w-[640px] text-sm">
                  <caption className="sr-only">{pl.name} package comparison</caption>
                  <thead className="bg-surface-2 text-left">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-semibold">Included</th>
                      {list.map((p) => <th key={p.id} scope="col" className="px-4 py-3 text-right font-semibold">{p.name}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {services.map((s) => (
                      <tr key={s.id}>
                        <th scope="row" className="px-4 py-3 text-left font-medium">
                          <Link href={`/${s.platform_slug}/${s.slug}`} className="inline-flex min-h-11 items-center hover:underline">{s.name}</Link>
                        </th>
                        {list.map((p) => {
                          const item = p.resolved.find((r) => r.service.id === s.id);
                          return (
                            <td key={p.id} className="px-4 py-3 text-right font-mono">
                              {item ? <span className="inline-flex items-center gap-1.5"><Check aria-hidden className="size-4 text-brand" />{fmtInt(item.qty)}</span> : <Minus aria-label="Not included" className="ml-auto size-4 text-fg-subtle" />}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="bg-surface-2/60">
                      <th scope="row" className="px-4 py-3 text-left font-semibold">Price</th>
                      {list.map((p) => <td key={p.id} className="px-4 py-3 text-right"><Price usd={p.price_usd} className="font-semibold" /></td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </Container>
    </>
  );
}
