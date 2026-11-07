import type { Metadata } from "next";
import { DoNotSellPanel } from "./panel";

export const metadata: Metadata = {
  title: "Do Not Sell or Share My Personal Information",
  robots: { index: false },
};

export default function DoNotSellPage() {
  return (
    <section className="mx-auto max-w-[68ch] px-4 py-16 md:py-24">
      <h1 className="font-display text-display-xl font-semibold">Do Not Sell or Share My Personal Information</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-fg-muted">
        <p>
          We do not sell your personal information. Some marketing cookies could count as &ldquo;sharing&rdquo; under the
          California Consumer Privacy Act (CCPA/CPRA). You can opt out of them here. If your browser sends a Global
          Privacy Control signal, we already treat it as an opt-out.
        </p>
      </div>
      <DoNotSellPanel />
    </section>
  );
}
