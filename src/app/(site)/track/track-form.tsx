"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LocalTime } from "@/components/shared/local-time";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions-util";
import { fmtInt, label } from "@/lib/format";
import { trackOrder, type TrackedOrder } from "./actions";

export function TrackForm({ initialCode }: { initialCode: string }) {
  const [state, action] = useActionState<ActionState<TrackedOrder>, FormData>(trackOrder, { status: "idle" });
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <>
      <form action={action} className="grid gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-[1fr_1.4fr_auto] sm:items-start" noValidate>
        <Field id="t-code" label="Order code" error={fe.code}>
          <Input id="t-code" name="code" defaultValue={initialCode} placeholder="ADZ-24817" autoCapitalize="characters" className="font-mono uppercase" {...describedBy("t-code", fe.code)} />
        </Field>
        <Field id="t-email" label="Email" error={fe.email}>
          <Input id="t-email" name="email" type="email" autoComplete="email" {...describedBy("t-email", fe.email)} />
        </Field>
        <div className="sm:pt-7"><Submit /></div>
      </form>

      <div aria-live="polite">
        {state.status === "error" && !Object.keys(fe).length && <p role="alert" className="mt-4 text-sm font-medium text-danger">{state.message}</p>}
        {state.status === "success" && <Result o={state.data} />}
      </div>
    </>
  );
}

function Result({ o }: { o: TrackedOrder }) {
  const progress = o.start_count !== null && o.delivered_count !== null ? Math.max(0, o.delivered_count - o.start_count) : null;
  return (
    <section className="mt-8 rounded-lg border border-border bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-sm text-fg-muted">{o.order_code}</p>
          <h2 className="font-display text-xl font-semibold">{o.quantity > 1 ? `${fmtInt(o.quantity)} × ` : ""}{o.item}</h2>
        </div>
        <div className="flex gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.payment_status} /></div>
      </div>
      {progress !== null && <p className="mt-3 text-sm text-fg-muted">Delivered so far: <span className="font-mono font-semibold text-fg">{fmtInt(progress)}</span></p>}
      <h3 className="mt-6 text-sm font-semibold text-fg">Timeline <span className="font-normal text-fg-subtle">(your local time)</span></h3>
      <ol className="mt-3 border-l-2 border-border pl-6">
        {[...o.history].reverse().map((h, i) => (
          <li key={`${h.at}-${i}`} className="relative pb-5 last:pb-0">
            <span aria-hidden className={`absolute top-1.5 -left-[31px] size-3 rounded-full border-2 ${i === 0 ? "border-brand bg-brand" : "border-border-strong bg-bg"}`} />
            <p className="font-semibold">{label(h.status)}</p>
            <p className="text-sm text-fg-muted"><LocalTime iso={h.at} />{h.note ? ` — ${h.note}` : ""}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={pending}>{pending ? "Checking…" : "Track"}</Button>;
}
