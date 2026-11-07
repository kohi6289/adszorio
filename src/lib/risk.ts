// Fraud / chargeback risk flags computed when an order is created. Any flag => admin review required.

const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org", "yopmail.com",
  "trashmail.com", "getnada.com", "sharklasers.com", "dispostable.com", "maildrop.cc", "throwawaymail.com",
  "fakeinbox.com", "mintemail.com", "emailondeck.com", "mohmal.com", "tempail.com", "burnermail.io",
]);

export type RiskFlag = "disposable_email" | "ip_country_mismatch" | "high_first_order" | "repeat_orders_today";

export const RISK_LABEL: Record<RiskFlag, string> = {
  disposable_email: "Disposable email domain",
  ip_country_mismatch: "IP country differs from stated country",
  high_first_order: "High value first order",
  repeat_orders_today: "Many orders from this email today",
};

export function riskFlags(input: {
  email: string;
  country: string | null;
  ipCountry: string | null;
  amountUsd: number;
  previousOrders: number;
  ordersToday: number;
  firstOrderMaxUsd: number;
}): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const domain = input.email.split("@")[1]?.toLowerCase() ?? "";
  if (DISPOSABLE.has(domain)) flags.push("disposable_email");
  if (input.country && input.ipCountry && input.country !== input.ipCountry) flags.push("ip_country_mismatch");
  if (input.previousOrders === 0 && input.amountUsd > input.firstOrderMaxUsd) flags.push("high_first_order");
  if (input.ordersToday >= 5) flags.push("repeat_orders_today");
  return flags;
}
