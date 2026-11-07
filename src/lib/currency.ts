import type { Currency, RoundingRule } from "@/types/models";

export const CURRENCY_COOKIE = "adz_ccy";

/** Fixed English locale per currency so server and client format identically (no hydration mismatch). */
const LOCALE: Record<string, string> = {
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  AED: "en-AE",
};

const EU = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

/** Default display currency for a visitor's ISO country code. Falls back to USD. */
export function currencyForCountry(country: string | null | undefined, available: readonly string[]): string {
  const c = (country ?? "").toUpperCase();
  const pick =
    c === "GB" ? "GBP" :
    c === "CA" ? "CAD" :
    c === "AU" ? "AUD" :
    c === "AE" ? "AED" :
    EU.has(c) ? "EUR" :
    "USD";
  return available.includes(pick) ? pick : "USD";
}

/** Display rounding. Only ever applied to the shown price, never to what is charged. */
export function applyRounding(value: number, rule: RoundingRule): number {
  const cents = Math.round(value * 100) / 100;
  if (rule === "cents" || value < 1) return cents;
  if (rule === "whole") return Math.ceil(cents);
  // end_99: smallest N.99 that is >= value (within half a cent)
  const candidate = Math.floor(value) + 0.99;
  return Math.round((candidate + 0.005 < value ? candidate + 1 : candidate) * 100) / 100;
}

export function convertFromUsd(usd: number, currency: Pick<Currency, "rate_to_usd" | "rounding_rule">): number {
  return applyRounding(usd * currency.rate_to_usd, currency.rounding_rule);
}

export function formatMoney(amount: number, code: string, opts: { compact?: boolean } = {}): string {
  const small = Math.abs(amount) > 0 && Math.abs(amount) < 1;
  return new Intl.NumberFormat(LOCALE[code] ?? "en-US", {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
    notation: opts.compact ? "compact" : "standard",
    minimumFractionDigits: opts.compact ? 0 : 2,
    maximumFractionDigits: small ? 3 : 2,
  }).format(amount);
}
