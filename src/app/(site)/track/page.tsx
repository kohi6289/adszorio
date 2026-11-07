import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/shared/section";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  return (
    <>
      <PageHeader eyebrow="Orders" title="Track your order" intro="Enter your order code and the email you ordered with." />
      <Container className="max-w-[860px] py-10 md:py-14">
        <TrackForm initialCode={code?.toUpperCase().slice(0, 12) ?? ""} />
      </Container>
    </>
  );
}
