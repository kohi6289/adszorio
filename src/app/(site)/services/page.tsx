import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/shared/section";
import { Catalogue } from "@/components/site/catalogue";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = {
  title: "All services and prices",
  description: "Every YouTube and Instagram service with per-1,000 pricing in your currency, start times, refill periods and delivery methods.",
  alternates: { canonical: "/services" },
};

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ platform?: string }> }) {
  const [{ platform }, catalog] = await Promise.all([searchParams, getCatalog()]);
  return (
    <>
      <PageHeader eyebrow="Services" title="All services and prices" intro="Search, filter and compare. Prices are per 1,000 in your selected currency." />
      <Container className="py-10 md:py-14">
        <Catalogue
          platforms={catalog.platforms}
          categories={catalog.categories}
          services={catalog.services}
          initialPlatform={catalog.platforms.some((p) => p.slug === platform) ? platform : ""}
        />
      </Container>
    </>
  );
}
