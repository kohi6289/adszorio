import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocalTime } from "@/components/shared/local-time";
import { Markdown } from "@/components/shared/markdown";
import { Container } from "@/components/shared/section";
import { getLegalPage } from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getLegalPage((await params).slug);
  return page ? { title: page.title, alternates: { canonical: `/legal/${page.slug}` } } : {};
}

export default async function LegalPage({ params }: Props) {
  const page = await getLegalPage((await params).slug);
  if (!page) notFound();
  return (
    <Container className="max-w-[860px] py-12 md:py-20">
      <h1 className="font-display text-display-xl font-semibold">{page.title}</h1>
      <p className="mt-3 text-sm text-fg-subtle">Version {page.version} · Last updated <LocalTime iso={page.updated_at} /></p>
      <Markdown source={page.body} className="mt-6" />
    </Container>
  );
}
