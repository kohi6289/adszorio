"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions-util";
import { changePassword } from "@/lib/admin/session-actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(changePassword, { status: "idle" });
  const err = (k: string) => (state.status === "error" ? state.fieldErrors?.[k] : undefined);
  return (
    <form action={action} className="grid gap-4">
      <Field id="p-current" label="Current password" error={err("current")}>
        <Input id="p-current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field id="p-next" label="New password" hint="At least 12 characters. A password manager makes this easy." error={err("next")}>
        <Input id="p-next" name="next" type="password" autoComplete="new-password" minLength={12} required />
      </Field>
      <Field id="p-confirm" label="Repeat new password" error={err("confirm")}>
        <Input id="p-confirm" name="confirm" type="password" autoComplete="new-password" minLength={12} required />
      </Field>
      {state.status === "error" && !state.fieldErrors && <p role="alert" className="text-sm font-medium text-danger">{state.message}</p>}
      {state.status === "success" && <p role="status" className="text-sm font-medium text-success">Password changed. Use the new one next time you sign in.</p>}
      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Change password"}</Button>
    </form>
  );
}
