"use client";

import { useId } from "react";
import { fmtInt } from "@/lib/format";
import { quantityStep } from "@/lib/pricing";

/** Slider + number input kept in sync. The number input allows exact amounts; the slider is for quick picks. */
export function QuantityPicker({ min, max, value, onChange, name }: { min: number; max: number; value: number; onChange: (n: number) => void; name?: string }) {
  const id = useId();
  const step = quantityStep(max);
  // Log scale on the slider so large ranges (100 → 1,000,000) stay usable on a phone.
  const toPos = (v: number) => (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min) || 1);
  const fromPos = (p: number) => {
    const raw = Math.exp(Math.log(min) + p * (Math.log(max) - Math.log(min)));
    const snapped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, snapped));
  };
  const pct = Math.round(toPos(Math.min(max, Math.max(min, value))) * 1000) / 10;

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-fg">Quantity</label>
        <input
          id={id}
          name={name}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-11 w-36 rounded-md border border-border-strong bg-surface px-3 text-right font-mono text-base font-semibold tabular-nums text-fg focus-visible:border-brand"
        />
      </div>
      <input
        type="range"
        aria-label="Quantity slider"
        aria-valuetext={`${fmtInt(value)}`}
        min={0}
        max={1000}
        value={Math.round(pct * 10)}
        onChange={(e) => onChange(fromPos(Number(e.target.value) / 1000))}
        className="adz-range h-11 w-full cursor-pointer"
        style={{ ["--pct" as string]: `${pct}%` }}
      />
      <div className="flex justify-between font-mono text-xs text-fg-subtle">
        <span>{fmtInt(min)}</span>
        <span>{fmtInt(max)}</span>
      </div>
    </div>
  );
}
