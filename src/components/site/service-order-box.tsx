"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";
import { deliveryEstimate, deliveryLabel, serviceTotalUsd } from "@/lib/pricing";
import type { ServiceView } from "@/types/models";
import { QuantityPicker } from "./quantity-picker";

export function ServiceOrderBox({ service }: { service: ServiceView }) {
  const [qty, setQty] = useState(Math.min(service.max_qty, Math.max(service.min_qty, 1000)));
  const valid = Number.isInteger(qty) && qty >= service.min_qty && qty <= service.max_qty;
  return (
    <div className="rounded-lg border border-border bg-surface p-5 shadow-2 md:p-6">
      <p className="flex items-baseline justify-between text-sm text-fg-muted">
        Price per 1,000 <Price usd={service.price_per_1000_usd} className="text-base font-semibold text-fg" />
      </p>
      <div className="mt-5"><QuantityPicker min={service.min_qty} max={service.max_qty} value={qty} onChange={setQty} /></div>
      <div className="mt-5 flex items-end justify-between border-t border-border pt-5">
        <span className="text-sm text-fg-muted">Total</span>
        {valid ? <Price usd={serviceTotalUsd(service, qty)} className="text-3xl font-semibold text-fg" /> : <span className="text-sm text-danger">Choose {service.min_qty.toLocaleString("en-US")}–{service.max_qty.toLocaleString("en-US")}</span>}
      </div>
      <p className="mt-2 text-sm text-fg-muted">Estimated: {deliveryLabel(deliveryEstimate(service, valid ? qty : service.min_qty))}</p>
      <Button asChild size="lg" className={`mt-5 w-full ${valid ? "" : "pointer-events-none opacity-50"}`} aria-disabled={!valid}>
        <Link href={`/order?service=${service.slug}&qty=${qty}`} tabIndex={valid ? undefined : -1}>Continue to order <ArrowRight aria-hidden /></Link>
      </Button>
      <p className="mt-3 text-center text-xs text-fg-subtle">No password needed. Payment details are emailed after ordering.</p>
    </div>
  );
}
