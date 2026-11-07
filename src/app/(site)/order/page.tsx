import type { Metadata } from "next";
import { headers } from "next/headers";
import { Container } from "@/components/shared/section";
import { countryOptions, COUNTRY_CODES } from "@/lib/countries";
import { getCatalog } from "@/lib/data";
import { OrderWizard } from "./order-wizard";

export const metadata: Metadata = { title: "Place an order", robots: { index: false } };

type Props = { searchParams: Promise<{ service?: string; package?: string; qty?: string }> };

export default async function OrderPage({ searchParams }: Props) {
  const [sp, catalog, h] = await Promise.all([searchParams, getCatalog(), headers()]);
  const ip = h.get("x-vercel-ip-country") ?? "";
  const pkg = sp.package && catalog.packages.find((p) => p.slug === sp.package);
  const svc = catalog.services.find((s) => s.slug === sp.service) ?? catalog.services.find((s) => s.is_featured) ?? catalog.services[0];
  const qty = Number(sp.qty);
  const initial = pkg
    ? { kind: "package" as const, slug: pkg.slug, qty: 1 }
    : { kind: "service" as const, slug: svc?.slug ?? "", qty: svc ? (Number.isInteger(qty) && qty >= svc.min_qty && qty <= svc.max_qty ? qty : Math.min(svc.max_qty, Math.max(svc.min_qty, 1000))) : 0 };

  return (
    <Container className="py-10 md:py-14">
      <h1 className="font-display text-display-lg font-semibold">Place an order</h1>
      <p className="mt-2 text-fg-muted">Four short steps. No account and no password needed.</p>
      <div className="mt-8">
        <OrderWizard
          platforms={catalog.platforms}
          services={catalog.services}
          packages={catalog.packages}
          countries={countryOptions()}
          initial={{ ...initial, country: COUNTRY_CODES.has(ip) ? ip : "" }}
        />
      </div>
    </Container>
  );
}
