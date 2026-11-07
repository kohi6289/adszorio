"use client";

import { useSyncExternalStore } from "react";
import { fmtDateTime } from "@/lib/format";

const subscribe = () => () => {};

/** Renders a timestamp in the visitor's own time zone. Server/first paint shows UTC, then swaps. */
export function LocalTime({ iso, className }: { iso: string; className?: string }) {
  const tz = useSyncExternalStore(subscribe, () => Intl.DateTimeFormat().resolvedOptions().timeZone, () => "UTC");
  return (
    <time dateTime={iso} className={className}>
      {fmtDateTime(iso, tz)}
    </time>
  );
}

/** Support hours (e.g. 10:00–22:00 Asia/Kolkata) converted into the visitor's time zone. */
export function LocalHours({ open, close, timezone, days }: { open: string; close: string; timezone: string; days: string }) {
  const tz = useSyncExternalStore(subscribe, () => Intl.DateTimeFormat().resolvedOptions().timeZone, () => timezone);
  const convert = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    // Find the UTC instant for today's hh:mm in the source zone, then format it in the visitor's zone.
    const now = new Date();
    const guess = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m);
    const offsetMin = (d: number) => {
      const p = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
      const g = (t: string) => Number(p.find((x) => x.type === t)?.value);
      return (Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute")) - d) / 60000;
    };
    const instant = guess - offsetMin(guess) * 60000;
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(instant);
  };
  const zone = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value;
  return (
    <span>
      {days}, {convert(open)}–{convert(close)} <span className="text-fg-subtle">({zone})</span>
    </span>
  );
}
