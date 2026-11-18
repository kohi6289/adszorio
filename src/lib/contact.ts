import type { SiteSettings } from "@/types/models";

export interface ContactChannel {
  key: "whatsapp" | "telegram" | "email";
  label: string;
  href: string;
  detail: string;
}

/** Business WhatsApp used when Settings → WhatsApp is empty. Orders are finalised over WhatsApp. */
export const DEFAULT_WHATSAPP = "+918910361246";

export const whatsappNumber = (contact: SiteSettings["contact"]) => contact.whatsapp.trim() || DEFAULT_WHATSAPP;

/** wa.me deep link, optionally with a pre-filled message. */
export const whatsappLink = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/[^\d]/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Contact channels that are configured in settings. Empty values are hidden, never shown as placeholders. */
export function contactChannels(contact: SiteSettings["contact"]): ContactChannel[] {
  const out: ContactChannel[] = [];
  const wa = whatsappNumber(contact);
  out.push({ key: "whatsapp", label: "WhatsApp", href: whatsappLink(wa), detail: wa });
  const tg = contact.telegram.replace(/^@/, "").trim();
  if (tg) out.push({ key: "telegram", label: "Telegram", href: `https://t.me/${tg}`, detail: `@${tg}` });
  if (contact.email) out.push({ key: "email", label: "Email", href: `mailto:${contact.email}`, detail: contact.email });
  return out;
}
