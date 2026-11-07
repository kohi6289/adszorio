import { Check } from "lucide-react";
import Link from "next/link";
import { Price } from "@/components/shared/price";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtInt } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PackageView } from "@/types/models";

export function PackageCard({ p, highlight }: { p: PackageView; highlight?: boolean }) {
  const saving = p.compare_at_price_usd ? p.compare_at_price_usd - p.price_usd : 0;
  return (
    <article
      data-platform={p.platform_slug}
      className={cn(
        "relative flex flex-col rounded-lg border bg-surface p-6 shadow-1",
        highlight ? "border-brand shadow-2" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-overline font-semibold text-accent uppercase">{p.platform_name}</p>
          <h3 className="mt-1 font-display text-2xl font-semibold">
            <Link href={`/packages/${p.slug}`} className="hover:underline">{p.name}</Link>
          </h3>
        </div>
        {p.badge && <Badge>{p.badge}</Badge>}
      </div>
      {p.tagline && <p className="mt-2 text-sm text-fg-muted">{p.tagline}</p>}
      <div className="mt-5 flex items-baseline gap-2">
        <Price usd={p.price_usd} className="text-3xl font-semibold text-fg" />
        {saving > 0.005 && p.compare_at_price_usd && (
          <span className="text-sm text-fg-subtle">
            <span className="sr-only">Bought separately: </span>
            <Price usd={p.compare_at_price_usd} className="line-through" />
          </span>
        )}
      </div>
      {saving > 0.005 && <p className="mt-1 text-sm font-medium text-success">Save <Price usd={saving} /> vs buying separately</p>}
      <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
        {p.resolved.map(({ service, qty }) => (
          <li key={service.id} className="flex gap-2.5">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
            <span><span className="font-mono font-semibold text-fg">{fmtInt(qty)}</span> <span className="text-fg-muted">{service.name.replace(/^(YouTube|Instagram)\s/, "")}</span></span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <Button asChild className="w-full" variant={highlight ? "primary" : "secondary"}>
          <Link href={`/order?package=${p.slug}`}>Choose {p.name}</Link>
        </Button>
      </div>
    </article>
  );
}
