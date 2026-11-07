"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Honeypot, Input, Select, Textarea } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions-util";
import { submitLead } from "./actions";

const BUDGETS = ["Under $100", "$100–$500", "$500–$2,000", "$2,000–$10,000", "$10,000+"];

export function LeadForm({ platforms, countries }: { platforms: string[]; countries: { code: string; name: string }[] }) {
  const [state, action] = useActionState<ActionState, FormData>(submitLead, { status: "idle" });
  const [utm] = useState(() => {
    if (typeof window === "undefined") return "{}";
    const p = new URLSearchParams(window.location.search);
    return JSON.stringify(Object.fromEntries([...p.entries()].filter(([k]) => k.startsWith("utm_"))));
  });
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-lg border border-border bg-surface p-8 text-center">
        <CheckCircle2 aria-hidden className="mx-auto size-10 text-success" />
        <h2 className="mt-3 font-display text-2xl font-semibold">Thanks, we&rsquo;ve got your message</h2>
        <p className="mt-2 text-fg-muted">We usually reply within one business day.</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="relative grid gap-5 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2 md:p-7">
      <Honeypot />
      <input type="hidden" name="utm" value={utm} />
      <input type="hidden" name="source_page" value="/contact" />
      <Field id="l-name" label="Name" error={fe.name}><Input id="l-name" name="name" autoComplete="name" {...describedBy("l-name", fe.name)} /></Field>
      <Field id="l-email" label="Email" error={fe.email}><Input id="l-email" name="email" type="email" autoComplete="email" {...describedBy("l-email", fe.email)} /></Field>
      <Field id="l-company" label="Company or channel" optional><Input id="l-company" name="company" autoComplete="organization" /></Field>
      <Field id="l-phone" label="Phone or WhatsApp" optional><Input id="l-phone" name="phone" type="tel" autoComplete="tel" /></Field>
      <Field id="l-country" label="Country" optional>
        <Select id="l-country" name="country" defaultValue=""><option value="">Choose…</option>{countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</Select>
      </Field>
      <Field id="l-platform" label="Platform" optional>
        <Select id="l-platform" name="platform_interest" defaultValue=""><option value="">Any</option>{platforms.map((p) => <option key={p}>{p}</option>)}<option>Other</option></Select>
      </Field>
      <Field id="l-budget" label="Monthly budget (USD)" optional className="sm:col-span-2">
        <Select id="l-budget" name="budget_range_usd" defaultValue=""><option value="">Prefer not to say</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</Select>
      </Field>
      <Field id="l-message" label="What do you need?" error={fe.message} className="sm:col-span-2">
        <Textarea id="l-message" name="message" rows={5} placeholder="Platforms, volumes, timing, anything else…" {...describedBy("l-message", fe.message)} />
      </Field>
      {state.status === "error" && !Object.keys(fe).length && <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">{state.message}</p>}
      <div className="sm:col-span-2"><Submit /></div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" disabled={pending}>{pending ? "Sending…" : "Send message"}</Button>;
}
