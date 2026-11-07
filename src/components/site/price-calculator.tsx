"use client";

import { ArrowRight, Clock, ShieldCheck } from "lucide-react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { useCurrency } from "@/components/shared/currency-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { deliveryEstimate, deliveryLabel, serviceTotalUsd } from "@/lib/pricing";
import type { Platform, ServiceView } from "@/types/models";
import { QuantityPicker } from "./quantity-picker";

/** Pick a service and quantity, see the live price in the visitor's currency and a delivery estimate. */
export function PriceCalculator({ platforms, services }: { platforms: Platform[]; services: ServiceView[] }) {
  // Only platforms that have at least one service can be calculated.
  const usable = platforms.filter((p) => services.some((s) => s.platform_slug === p.slug));
  const [platform, setPlatform] = useState(usable[0]?.slug ?? "");
  const list = useMemo(() => services.filter((s) => s.platform_slug === platform), [services, platform]);
  const [slug, setSlug] = useState(list[0]?.slug ?? "");
  const service = list.find((s) => s.slug === slug) ?? list[0];
  const [qty, setQty] = useState(service ? Math.max(service.min_qty, 1000) : 0);
  const selectId = useId();

  const pickPlatform = (p: string) => {
    setPlatform(p);
    const first = services.find((s) => s.platform_slug === p);
    if (first) {
      setSlug(first.slug);
      setQty(Math.min(first.max_qty, Math.max(first.min_qty, 1000)));
    }
  };
  const pickService = (s: string) => {
    setSlug(s);
    const next = list.find((x) => x.slug === s);
    if (next) setQty((q) => Math.min(next.max_qty, Math.max(next.min_qty, q)));
  };

  if (!service) return null;
  const valid = qty >= service.min_qty && qty <= service.max_qty && Number.isInteger(qty);
  const usd = valid ? serviceTotalUsd(service, qty) : 0;
  const est = deliveryEstimate(service, valid ? qty : service.min_qty);

  return (
    <div data-platform={platform} className="rounded-lg border border-border bg-surface p-5 shadow-2 md:p-7">
      <div role="tablist" aria-label="Platform" className="grid auto-cols-fr grid-flow-col gap-1 rounded-md bg-surface-2 p-1">
        {usable.map((p) => (
          <button
            key={p.id}
            role="tab"
            type="button"
            aria-selected={p.slug === platform}
            onClick={() => pickPlatform(p.slug)}
            className="min-h-11 cursor-pointer rounded-[10px] text-sm font-semibold text-fg-muted transition-colors aria-selected:bg-surface aria-selected:text-fg aria-selected:shadow-1"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-1.5">
        <label htmlFor={selectId} className="text-sm font-semibold text-fg">Service</label>
        <Select id={selectId} value={service.slug} onChange={(e) => pickService(e.target.value)}>
          {list.map((s) => (
            <option key={s.id} value={s.slug}>{s.name}</option>
          ))}
        </Select>
      </div>

      <div className="mt-5">
        <QuantityPicker min={service.min_qty} max={service.max_qty} value={qty} onChange={setQty} />
      </div>

      <div className="mt-6 flex items-end justify-between gap-4 border-t border-border pt-5">
        <div>
          <p className="text-sm text-fg-muted">Total</p>
          <AnimatedPrice usd={usd} />
          {!valid && <p className="mt-1 text-sm text-danger" role="status">Choose between {service.min_qty.toLocaleString("en-US")} and {service.max_qty.toLocaleString("en-US")}.</p>}
        </div>
        <Button asChild size="lg" aria-disabled={!valid} className={valid ? "" : "pointer-events-none opacity-50"}>
          <Link href={`/order?service=${service.slug}&qty=${qty}`} tabIndex={valid ? undefined : -1}>
            Order now <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
      <ul className="mt-4 grid gap-2 text-sm text-fg-muted">
        <li className="flex gap-2"><Clock aria-hidden className="mt-0.5 size-4 shrink-0" />Estimated: {deliveryLabel(est)}</li>
        <li className="flex gap-2"><ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />{service.refill_days ? `${service.refill_days}-day free refill if the count drops` : "No refill on this service"}</li>
      </ul>
    </div>
  );
}

function AnimatedPrice({ usd }: { usd: number }) {
  const { format } = useCurrency();
  const reduce = useReducedMotion();
  const mv = useMotionValue(usd);
  const [shown, setShown] = useState(usd);
  useEffect(() => {
    if (reduce) {
      mv.set(usd);
      return;
    }
    const controls = animate(mv, usd, { type: "spring", stiffness: 120, damping: 20 });
    return () => controls.stop();
  }, [usd, reduce, mv]);
  useEffect(() => mv.on("change", (v) => setShown(v)), [mv]);
  return (
    <p className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-fg" aria-live="polite" aria-atomic>
      <span className="sr-only">{format(usd)}</span>
      <span aria-hidden>{format(reduce ? usd : shown)}</span>
    </p>
  );
}
