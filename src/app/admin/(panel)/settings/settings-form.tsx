"use client";

import { startTransition, useActionState } from "react";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions-util";
import { saveSettings } from "@/lib/admin/settings-actions";
import type { SiteSettings } from "@/types/models";

export function SettingsForm({ s, priv, currencies }: { s: SiteSettings; priv: { notification_emails: string[]; first_order_max_usd: number }; currencies: string[] }) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(saveSettings, { status: "idle" });
  const fe = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => dispatch(fd)); }} className="grid gap-4" noValidate>
      {state.status === "success" && <p role="status" className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm font-medium text-success">Settings saved. The site is updated.</p>}
      {state.status === "error" && <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{state.message}</p>}

      <Panel title="Contact (shown on the site)">
        <div className="grid gap-4 sm:grid-cols-2">
          <F fe={fe} name="contact_email" label="Support email" def={s.contact.email} type="email" />
          <F fe={fe} name="whatsapp" label="WhatsApp number" hint="International format, e.g. +919800000000. Empty hides it." def={s.contact.whatsapp} />
          <F fe={fe} name="telegram" label="Telegram username" hint="Without @. Empty hides it." def={s.contact.telegram} />
          <Field id="s-socials" label="Social links" hint="One per line: Label | https://…" className="sm:col-span-2"><Textarea id="s-socials" name="socials" rows={3} defaultValue={s.socials.map((x) => `${x.label} | ${x.url}`).join("\n")} /></Field>
        </div>
      </Panel>

      <Panel title="Support hours">
        <div className="grid gap-4 sm:grid-cols-4">
          <F fe={fe} name="support_tz" label="Time zone" def={s.support_hours.timezone} />
          <F fe={fe} name="support_days" label="Days" def={s.support_hours.days} />
          <F fe={fe} name="support_open" label="Opens" type="time" def={s.support_hours.open} />
          <F fe={fe} name="support_close" label="Closes" type="time" def={s.support_hours.close} />
        </div>
      </Panel>

      <Panel title="Home page & announcement">
        <div className="grid gap-4 sm:grid-cols-2">
          <F fe={fe} name="announcement" label="Announcement strip text" hint="Empty hides the strip." def={s.announcement?.text ?? ""} wide />
          <F fe={fe} name="announcement_link" label="Announcement link" def={s.announcement?.link ?? ""} />
          <Field id="s-currency" label="Default currency" hint="Used when the visitor's country has no mapped currency." error={fe.default_currency}>
            <Select id="s-currency" name="default_currency" defaultValue={s.default_currency}>{currencies.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
          <Field id="s-stats" label="Trust stats (real numbers only)" hint="One per line: Label | number | optional suffix. Empty hides the stats." error={fe.stats} className="sm:col-span-2">
            <Textarea id="s-stats" name="stats" rows={3} defaultValue={s.stats.map((x) => `${x.label} | ${x.value}${x.suffix ? ` | ${x.suffix}` : ""}`).join("\n")} placeholder="Orders completed | 1250" {...describedBy("s-stats", fe.stats)} />
          </Field>
        </div>
      </Panel>

      <Panel title="SEO & brand">
        <div className="grid gap-4 sm:grid-cols-2">
          <F fe={fe} name="brand" label="Brand name" def={s.brand} />
          <F fe={fe} name="domain" label="Domain" def={s.domain} />
          <F fe={fe} name="seo_title" label="Default page title" def={s.seo.title} wide />
          <Field id="s-seo-d" label="Default description" className="sm:col-span-2"><Textarea id="s-seo-d" name="seo_description" rows={2} defaultValue={s.seo.description} /></Field>
        </div>
      </Panel>

      <Panel title="Private: notifications & fraud (never shown on the site)">
        <div className="grid gap-4 sm:grid-cols-2">
          <F fe={fe} name="notification_emails" label="Notification emails" hint="Comma-separated. Get an email for every order, flagged order, lead and privacy request." def={priv.notification_emails.join(", ")} wide />
          <F fe={fe} name="first_order_max_usd" label="First-order review limit (USD)" hint="First orders above this are flagged for review." type="number" def={priv.first_order_max_usd} />
        </div>
      </Panel>

      <Button type="submit" disabled={pending} className="justify-self-start">{pending ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}

function F({ fe, name, label, hint, def, type = "text", wide }: { fe: Record<string, string>; name: string; label: string; hint?: string; def: string | number; type?: string; wide?: boolean }) {
  return (
    <Field id={`s-${name}`} label={label} hint={hint} error={fe[name]} className={wide ? "sm:col-span-2" : undefined}>
      <Input id={`s-${name}`} name={name} type={type} defaultValue={def} {...describedBy(`s-${name}`, fe[name])} />
    </Field>
  );
}
