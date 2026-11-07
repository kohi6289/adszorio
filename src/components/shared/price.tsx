"use client";

import { cn } from "@/lib/utils";
import { useCurrency } from "./currency-provider";

/** Displays a USD amount in the visitor's currency. Tabular figures so changes never shift layout. */
export function Price({ usd, className }: { usd: number; className?: string }) {
  const { format } = useCurrency();
  return <span className={cn("font-mono tabular-nums", className)}>{format(usd)}</span>;
}
