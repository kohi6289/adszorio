"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Honeypot, Input, Textarea } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions-util";
import { submitDataRequest } from "./actions";

export function RequestForm() {
  const [state, action] = useActionState<ActionState, FormData>(submitDataRequest, { status: "idle" });
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  if (state.status === "success")
    return <p role="status" className="flex gap-3 rounded-lg border border-border bg-surface p-5 font-medium"><CheckCircle2 aria-hidden className="size-5 text-success" />Request received. We&rsquo;ll verify it by email and respond within 30 days.</p>;
  return (
    <form action={action} noValidate className="relative grid gap-5 rounded-lg border border-border bg-surface p-5 md:p-7">
      <Honeypot />
      <fieldset aria-describedby={fe.type ? "r-type-error" : undefined}>
        <legend className="text-sm font-semibold">What would you like us to do?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {[["export", "Send me a copy of my data"], ["delete", "Delete my data"]].map(([v, l]) => (
            <label key={v} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-border px-4 has-checked:border-brand">
              <input type="radio" name="type" value={v} className="size-5 accent-[var(--brand)]" />{l}
            </label>
          ))}
        </div>
        {fe.type && <p id="r-type-error" role="alert" className="mt-1.5 text-sm font-medium text-danger">{fe.type}</p>}
      </fieldset>
      <Field id="r-email" label="Email you used with us" error={fe.email}><Input id="r-email" name="email" type="email" autoComplete="email" {...describedBy("r-email", fe.email)} /></Field>
      <Field id="r-details" label="Anything we should know" optional><Textarea id="r-details" name="details" rows={3} placeholder="Order codes, other emails…" /></Field>
      {state.status === "error" && !Object.keys(fe).length && <p role="alert" className="text-sm font-medium text-danger">{state.message}</p>}
      <Submit />
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" className="justify-self-start" disabled={pending}>{pending ? "Sending…" : "Submit request"}</Button>;
}
