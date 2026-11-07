"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions-util";
import { signIn } from "@/lib/admin/session-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, { status: "idle" });
  return (
    <form action={action} className="mt-6 grid gap-4 rounded-lg border border-border bg-surface p-5">
      <Field id="a-email" label="Email"><Input id="a-email" name="email" type="email" autoComplete="username" required /></Field>
      <Field id="a-pass" label="Password"><Input id="a-pass" name="password" type="password" autoComplete="current-password" required /></Field>
      {state.status === "error" && <p role="alert" className="text-sm font-medium text-danger">{state.message}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
