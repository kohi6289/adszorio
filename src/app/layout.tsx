import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { cookies, headers } from "next/headers";
import { ThemeProvider } from "next-themes";
import { ConsentProvider } from "@/components/shared/consent";
import { CurrencyProvider } from "@/components/shared/currency-provider";
import { CURRENCY_COOKIE } from "@/lib/currency";
import { getCurrencies, getSiteSettings } from "@/lib/data";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  return {
    metadataBase: new URL(`https://${s.domain}`),
    title: { default: s.seo.title, template: `%s · ${s.brand}` },
    description: s.seo.description,
    openGraph: { siteName: s.brand, type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d10" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, currencies, cookieStore, headerStore] = await Promise.all([getSiteSettings(), getCurrencies(), cookies(), headers()]);
  const requested = cookieStore.get(CURRENCY_COOKIE)?.value ?? headerStore.get("x-adz-currency") ?? settings.default_currency;
  const initialCode = currencies.some((c) => c.code === requested) ? requested : "USD";

  return (
    <html lang="en" suppressHydrationWarning className={`${bricolage.variable} ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ConsentProvider>
            <CurrencyProvider currencies={currencies} initialCode={initialCode}>
              {children}
            </CurrencyProvider>
          </ConsentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
