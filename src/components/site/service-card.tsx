import { Clock, Gauge, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { Price } from "@/components/shared/price";
import { Button } from "@/components/ui/button";
import { fmtInt } from "@/lib/format";
import type { ServiceView } from "@/types/models";
import { PlatformIcon } from "./platform-icon";

export const TIER_LABEL = { standard: "Standard", premium: "Premium", elite: "Elite" } as const;

export function ServiceCard({ s }: { s: ServiceView }) {
  return (
    <article data-platform={s.platform_slug} className="group relative flex flex-col rounded-lg border border-border bg-surface p-5 shadow-1 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-2">
      <div className="flex items-start gap-3">
        <PlatformIcon slug={s.platform_slug} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-fg-subtle">{s.category_name} · {TIER_LABEL[s.quality_tier]}</p>
          <h3 className="mt-0.5 font-semibold leading-snug text-fg">
            <Link href={`/${s.platform_slug}/${s.slug}`} className="after:absolute after:inset-0 after:rounded-lg">
              {s.name}
            </Link>
          </h3>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-fg-muted">
        <div className="col-span-2 flex items-baseline justify-between border-b border-border pb-3">
          <dt className="text-fg-muted">Per 1,000</dt>
          <dd><Price usd={s.price_per_1000_usd} className="text-xl font-semibold text-fg" /></dd>
        </div>
        <div className="flex items-center gap-1.5"><dt><Clock aria-label="Starts" className="size-4" /></dt><dd>{s.start_time}</dd></div>
        <div className="flex items-center gap-1.5"><dt><RefreshCcw aria-label="Refill" className="size-4" /></dt><dd>{s.refill_days ? `${s.refill_days}-day refill` : "No refill"}</dd></div>
        <div className="col-span-2 flex items-center gap-1.5"><dt><Gauge aria-label="Speed" className="size-4" /></dt><dd>{s.speed}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-fg-subtle">Order {fmtInt(s.min_qty)}–{fmtInt(s.max_qty)}</p>
      <div className="relative z-10 mt-auto pt-4">
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/order?service=${s.slug}`}>Order</Link>
        </Button>
      </div>
    </article>
  );
}
