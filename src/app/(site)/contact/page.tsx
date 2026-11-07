import { Mail, MessageCircle, Send } from "lucide-react";
import type { Metadata } from "next";
import { LocalHours } from "@/components/shared/local-time";
import { Container, PageHeader } from "@/components/shared/section";
import { contactChannels } from "@/lib/contact";
import { countryOptions } from "@/lib/countries";
import { getPlatforms, getSiteSettings } from "@/lib/data";
import { LeadForm } from "./lead-form";

export const metadata: Metadata = {
  title: "Contact and custom quotes",
  description: "Agencies, resellers and large orders: tell us what you need and we'll send a quote.",
  alternates: { canonical: "/contact" },
};

const ICON = { whatsapp: MessageCircle, telegram: Send, email: Mail } as const;

export default async function ContactPage() {
  const [settings, platforms] = await Promise.all([getSiteSettings(), getPlatforms()]);
  const channels = contactChannels(settings.contact);
  return (
    <>
      <PageHeader eyebrow="Contact" title="Talk to us or get a custom quote" intro="For agencies, resellers and large or recurring orders. Quick questions are faster on chat apps." />
      <Container className="grid gap-10 py-10 md:py-14 lg:grid-cols-12">
        <div className="lg:col-span-8"><LeadForm platforms={platforms.map((p) => p.name)} countries={countryOptions()} /></div>
        <aside className="lg:col-span-4">
          <h2 className="font-semibold">Direct contact</h2>
          <ul className="mt-3 grid gap-2">
            {channels.map((c) => {
              const Icon = ICON[c.key];
              return (
                <li key={c.key}>
                  <a href={c.href} target={c.key === "email" ? undefined : "_blank"} rel="noopener noreferrer" className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-surface px-4 hover:border-border-strong">
                    <Icon aria-hidden className="size-5 text-brand" />
                    <span><span className="block text-sm font-semibold">{c.label}</span><span className="font-mono text-xs text-fg-muted">{c.detail}</span></span>
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-fg-muted">Support hours: <LocalHours {...settings.support_hours} /></p>
        </aside>
      </Container>
    </>
  );
}
