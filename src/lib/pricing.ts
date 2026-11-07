import type { Package, Service } from "@/types/models";

// Server-side source of truth for what an order costs. Never trust a client-sent total.

export const round2 = (n: number) => Math.round(n * 100) / 100;

export type QtyCheck = { ok: true } | { ok: false; message: string };

export function checkQuantity(service: Pick<Service, "min_qty" | "max_qty">, qty: number): QtyCheck {
  if (!Number.isInteger(qty)) return { ok: false, message: "Quantity must be a whole number." };
  if (qty < service.min_qty) return { ok: false, message: `Minimum order is ${service.min_qty.toLocaleString("en-US")}.` };
  if (qty > service.max_qty) return { ok: false, message: `Maximum order is ${service.max_qty.toLocaleString("en-US")}.` };
  return { ok: true };
}

export function serviceTotalUsd(service: Pick<Service, "price_per_1000_usd">, qty: number): number {
  return round2((Number(service.price_per_1000_usd) * qty) / 1000);
}

export function packageTotalUsd(pkg: Pick<Package, "price_usd">): number {
  return round2(Number(pkg.price_usd));
}

/** Rough delivery window: start time plus quantity at the service's daily speed. */
export function deliveryEstimate(service: Pick<Service, "start_time_hours_max" | "speed_per_day">, qty: number) {
  const days = Math.max(1, Math.ceil(qty / Math.max(1, service.speed_per_day)));
  return { startHours: service.start_time_hours_max, days };
}

export function deliveryLabel(est: { startHours: number; days: number }) {
  const start = est.startHours <= 24 ? `starts within ${est.startHours} h` : `starts within ${Math.ceil(est.startHours / 24)} days`;
  return `${start}, completes in about ${est.days} day${est.days === 1 ? "" : "s"}`;
}

/** Snap a quantity onto sensible steps for sliders. */
export function quantityStep(max: number) {
  if (max <= 2_000) return 10;
  if (max <= 20_000) return 100;
  if (max <= 200_000) return 500;
  return 1_000;
}
