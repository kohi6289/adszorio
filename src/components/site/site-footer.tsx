import Link from "next/link";
import type { Platform, SiteSettings } from "@/types/models";
import { contactChannels } from "@/lib/contact";
import { CookieSettingsButton } from "./cookie-consent";
import { Logo } from "./logo";

const LEGAL = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/refund-refill", label: "Refund & Refill Policy" },
  { href: "/legal/chargeback", label: "Chargeback Policy" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/cookies", label: "Cookie Policy" },
];

const linkCls = "inline-flex min-h-11 items-center hover:text-fg";

export function SiteFooter({ settings, platforms }: { settings: SiteSettings; platforms: Platform[] }) {
  const channels = contactChannels(settings.contact);
  const year = new Date().getUTCFullYear();
  return (
    <footer className="mt-24 border-t border-border bg-surface pb-28 md:pb-0">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-12 md:px-6 lg:px-8">
        <div className="md:col-span-4">
          <Logo name={settings.brand} />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">
            Growth services for YouTube and Instagram with transparent per-1,000 pricing and a plain-language delivery method on every service.
          </p>
        </div>

        <nav aria-label="Services" className="md:col-span-2">
          <h2 className="text-overline font-semibold text-fg-subtle uppercase">Services</h2>
          <ul className="mt-2 text-sm text-fg-muted">
            <li><Link className={linkCls} href="/services">All services</Link></li>
            {platforms.map((p) => (
              <li key={p.id}><Link className={linkCls} href={`/${p.slug}`}>{p.name}</Link></li>
            ))}
            <li><Link className={linkCls} href="/packages">Packages</Link></li>
          </ul>
        </nav>

        <nav aria-label="Help" className="md:col-span-2">
          <h2 className="text-overline font-semibold text-fg-subtle uppercase">Help</h2>
          <ul className="mt-2 text-sm text-fg-muted">
            <li><Link className={linkCls} href="/track">Track order</Link></li>
            <li><Link className={linkCls} href="/faq">FAQ</Link></li>
            <li><Link className={linkCls} href="/contact">Contact</Link></li>
            {channels.filter((c) => c.key !== "email").map((c) => (
              <li key={c.key}><a className={linkCls} href={c.href} target="_blank" rel="noopener noreferrer">{c.label}</a></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Legal" className="md:col-span-4">
          <h2 className="text-overline font-semibold text-fg-subtle uppercase">Legal &amp; privacy</h2>
          <ul className="mt-2 grid text-sm text-fg-muted sm:grid-cols-2 md:grid-cols-1">
            {LEGAL.map((l) => (
              <li key={l.href}><Link className={linkCls} href={l.href}>{l.label}</Link></li>
            ))}
            <li><Link className={linkCls} href="/privacy/do-not-sell">Do Not Sell or Share My Personal Information</Link></li>
            <li><CookieSettingsButton /></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-4 py-3 text-xs md:items-center text-fg-subtle md:flex-row md:justify-between md:px-6 lg:px-8">
          <p>© {year} {settings.brand}. Not affiliated with YouTube, Google, Instagram or Meta.</p>
          {settings.contact.email && <a href={`mailto:${settings.contact.email}`} className="inline-flex min-h-11 items-center hover:text-fg">{settings.contact.email}</a>}
        </div>
      </div>
    </footer>
  );
}
