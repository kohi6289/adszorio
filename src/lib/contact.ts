import type { SiteSettings } from "@/types/models";

export interface ContactChannel {
  key: "whatsapp" | "telegram" | "email";
  label: string;
  href: string;
  detail: string;
}

/** Contact channels that are configured in settings. Empty values are hidden, never shown as placeholders. */
export function contactChannels(contact: SiteSettings["contact"]): ContactChannel[] {
  const out: ContactChannel[] = [];
  const wa = contact.whatsapp.replace(/[^\d]/g, "");
  if (wa) out.push({ key: "whatsapp", label: "WhatsApp", href: `https://wa.me/${wa}`, detail: contact.whatsapp });
  const tg = contact.telegram.replace(/^@/, "").trim();
  if (tg) out.push({ key: "telegram", label: "Telegram", href: `https://t.me/${tg}`, detail: `@${tg}` });
  if (contact.email) out.push({ key: "email", label: "Email", href: `mailto:${contact.email}`, detail: contact.email });
  return out;
}
