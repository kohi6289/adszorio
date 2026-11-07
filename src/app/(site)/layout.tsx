import { AnnouncementStrip } from "@/components/site/announcement-strip";
import { CookieConsent } from "@/components/site/cookie-consent";
import { FloatingContact } from "@/components/site/floating-contact";
import { PlatformAccents } from "@/components/site/platform-accents";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { contactChannels } from "@/lib/contact";
import { getPlatforms, getSiteSettings } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, platforms] = await Promise.all([getSiteSettings(), getPlatforms()]);
  return (
    <>
      <PlatformAccents platforms={platforms} />
      <a
        href="#main"
        className="sr-only z-[60] rounded-md bg-brand px-4 py-3 font-semibold text-brand-fg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <AnnouncementStrip announcement={settings.announcement} />
      <SiteHeader brand={settings.brand} platforms={platforms} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} platforms={platforms} />
      <FloatingContact channels={contactChannels(settings.contact)} />
      <CookieConsent />
    </>
  );
}
