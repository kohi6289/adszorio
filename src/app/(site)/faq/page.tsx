import type { Metadata } from "next";
import { FaqList } from "@/components/shared/faq-list";
import { JsonLd } from "@/components/shared/json-ld";
import { Container, PageHeader } from "@/components/shared/section";
import { getFaqs } from "@/lib/data";

export const metadata: Metadata = { title: "Frequently asked questions", alternates: { canonical: "/faq" } };

export default async function FaqPage() {
  const faqs = await getFaqs();
  const groups = [...new Set(faqs.map((f) => f.category))];
  return (
    <>
      <PageHeader eyebrow="Help" title="Frequently asked questions" />
      <Container className="max-w-[860px] py-10 md:py-14">
        {groups.map((g) => (
          <section key={g} aria-labelledby={`faq-${g}`} className="pb-10">
            <h2 id={`faq-${g}`} className="mb-2 font-display text-xl font-semibold">{g}</h2>
            <FaqList faqs={faqs.filter((f) => f.category === g)} withJsonLd={false} />
          </section>
        ))}
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          }}
        />
      </Container>
    </>
  );
}
