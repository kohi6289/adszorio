import { Plus } from "lucide-react";
import type { Faq } from "@/types/models";
import { Markdown } from "./markdown";
import { JsonLd } from "./json-ld";

/** Native <details> accordion: keyboard accessible, works without JavaScript. */
export function FaqList({ faqs, withJsonLd = true }: { faqs: Faq[]; withJsonLd?: boolean }) {
  if (faqs.length === 0) return null;
  return (
    <>
      <div className="divide-y divide-border border-y border-border">
        {faqs.map((f) => (
          <details key={f.id} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold text-fg [&::-webkit-details-marker]:hidden">
              {f.question}
              <Plus aria-hidden className="size-5 shrink-0 text-fg-muted transition-transform duration-200 group-open:rotate-45" />
            </summary>
            <Markdown source={f.answer} className="pb-5 [&>p:first-child]:mt-0" />
          </details>
        ))}
      </div>
      {withJsonLd && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
          }}
        />
      )}
    </>
  );
}
