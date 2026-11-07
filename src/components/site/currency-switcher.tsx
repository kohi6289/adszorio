"use client";

import { ChevronDown } from "lucide-react";
import { useId } from "react";
import { useCurrency } from "@/components/shared/currency-provider";
import { cn } from "@/lib/utils";

// Native <select>: fully keyboard/screen-reader accessible and uses the OS picker on phones.
export function CurrencySwitcher({ className }: { className?: string }) {
  const { currency, currencies, setCurrency } = useCurrency();
  const id = useId();
  return (
    <div className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Display currency
      </label>
      <select
        id={id}
        value={currency.code}
        onChange={(e) => setCurrency(e.target.value)}
        className="h-11 cursor-pointer appearance-none rounded-md border border-border bg-surface py-0 pr-8 pl-3 font-mono text-sm! font-medium text-fg transition-colors hover:border-border-strong"
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} {c.symbol !== c.code ? c.symbol : ""}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-fg-muted" />
    </div>
  );
}
