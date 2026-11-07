"use client";

import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Price } from "@/components/shared/price";
import { QuantityPicker } from "@/components/site/quantity-picker";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Honeypot, Input, Select } from "@/components/ui/form";
import type { ActionState } from "@/lib/actions-util";
import { fmtInt, LINK_LABEL } from "@/lib/format";
import { LINK_EXAMPLES, validateLink } from "@/lib/links";
import { deliveryEstimate, deliveryLabel, serviceTotalUsd } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { LinkType, PackageView, Platform, ServiceView } from "@/types/models";
import { createOrder } from "./actions";

const STEPS = ["Choose", "Link", "Your details", "Review"] as const;
const STEP_OF_FIELD = (f: string) => (f === "qty" ? 0 : f.startsWith("link_") ? 1 : ["name", "email", "country", "phone", "terms"].includes(f) ? 2 : 3);

export function OrderWizard({
  platforms,
  services,
  packages,
  countries,
  initial,
}: {
  platforms: Platform[];
  services: ServiceView[];
  packages: PackageView[];
  countries: { code: string; name: string }[];
  initial: { kind: "service" | "package"; slug: string; qty: number; country: string };
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createOrder, { status: "idle" });
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState(initial.kind);
  const [slug, setSlug] = useState(initial.slug);
  const [qty, setQty] = useState(initial.qty);
  const [links, setLinks] = useState<Partial<Record<LinkType, string>>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState(initial.country);
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [timezone] = useState(() => (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : ""));
  const headingRef = useRef<HTMLHeadingElement>(null);

  const service = kind === "service" ? services.find((s) => s.slug === slug) : undefined;
  const pkg = kind === "package" ? packages.find((p) => p.slug === slug) : undefined;
  const linkTypes: LinkType[] = useMemo(
    () => (service ? [service.link_type] : pkg ? [...new Set(pkg.resolved.map((r) => r.service.link_type))] : []),
    [service, pkg],
  );
  const totalUsd = service ? serviceTotalUsd(service, Number.isInteger(qty) ? qty : 0) : pkg ? pkg.price_usd : 0;
  const platformSlug = service?.platform_slug ?? pkg?.platform_slug;

  // Server-side errors: show them and jump to the first step that has one.
  useEffect(() => {
    if (state.status !== "error") return;
    const fe = state.fieldErrors ?? {};
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors(fe);
    const keys = Object.keys(fe);
    if (keys.length) setStep(Math.min(...keys.map(STEP_OF_FIELD)));
  }, [state]);

  useEffect(() => headingRef.current?.focus(), [step]);

  function validate(s: number): boolean {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!service && !pkg) e.choice = "Please choose a service or package.";
      if (service && (!Number.isInteger(qty) || qty < service.min_qty || qty > service.max_qty))
        e.qty = `Choose a quantity between ${fmtInt(service.min_qty)} and ${fmtInt(service.max_qty)}.`;
    }
    if (s === 1) {
      for (const t of linkTypes) {
        const r = validateLink(t, links[t] ?? "");
        if (!r.ok) e[`link_${t}`] = r.message;
      }
    }
    if (s === 2) {
      if (name.trim().length < 2) e.name = "Please enter your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = "Please enter a valid email address.";
      if (!country) e.country = "Please choose your country.";
      if (!terms) e.terms = "Please accept the Terms of Service to continue.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const next = () => validate(step) && setStep((s) => Math.min(3, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const choose = (k: "service" | "package", value: string) => {
    setKind(k);
    setSlug(value);
    if (k === "service") {
      const s = services.find((x) => x.slug === value);
      if (s) setQty((q) => Math.min(s.max_qty, Math.max(s.min_qty, q || 1000)));
    }
    setErrors({});
  };

  return (
    <div data-platform={platformSlug} className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8">
        {/* Progress */}
        <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? "step" : undefined} className="grid gap-2">
              <span className={cn("h-1.5 rounded-full", i <= step ? "bg-brand" : "bg-surface-2")} />
              <span className={cn("text-xs font-semibold sm:text-sm", i === step ? "text-fg" : "text-fg-subtle")}>
                <span className="sr-only">Step {i + 1}: </span>{label}
                {i < step && <span className="sr-only"> (done)</span>}
              </span>
            </li>
          ))}
        </ol>

        <form action={formAction} noValidate className="mt-8" onSubmit={(e) => { if (step !== 3) { e.preventDefault(); next(); } }}>
          <Honeypot />
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="qty" value={qty} />
          <input type="hidden" name="timezone" value={timezone} />

          <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-semibold outline-none">
            {["What would you like to order?", "Where should we deliver it?", "Your contact details", "Review your order"][step]}
          </h2>

          {/* Step 1 */}
          <section hidden={step !== 0} className="mt-6 grid gap-6">
            <div role="radiogroup" aria-label="Order type" className="grid grid-cols-2 gap-1 rounded-md bg-surface-2 p-1 sm:max-w-sm">
              {(["service", "package"] as const).map((k) => (
                <button key={k} type="button" role="radio" aria-checked={kind === k}
                  onClick={() => choose(k, k === "service" ? (services[0]?.slug ?? "") : (packages[0]?.slug ?? ""))}
                  className="min-h-11 cursor-pointer rounded-[10px] text-sm font-semibold text-fg-muted aria-checked:bg-surface aria-checked:text-fg aria-checked:shadow-1">
                  {k === "service" ? "Single service" : "Package"}
                </button>
              ))}
            </div>

            {kind === "service" ? (
              <>
                <Field id="o-service" label="Service">
                  <Select id="o-service" value={slug} onChange={(e) => choose("service", e.target.value)}>
                    {platforms.map((p) => (
                      <optgroup key={p.id} label={p.name}>
                        {services.filter((s) => s.platform_slug === p.slug).map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
                      </optgroup>
                    ))}
                  </Select>
                </Field>
                {service && (
                  <div className="rounded-lg border border-border bg-surface p-4 md:p-5">
                    <QuantityPicker min={service.min_qty} max={service.max_qty} value={qty} onChange={setQty} />
                    {errors.qty && <p role="alert" className="mt-2 text-sm font-medium text-danger">{errors.qty}</p>}
                    <p className="mt-3 text-sm text-fg-muted">
                      <Price usd={service.price_per_1000_usd} /> per 1,000 · {deliveryLabel(deliveryEstimate(service, Number.isInteger(qty) && qty > 0 ? qty : service.min_qty))}
                    </p>
                    <p className="mt-3 rounded-md bg-surface-2 p-3 text-sm text-fg-muted"><span className="font-semibold text-fg">How it&rsquo;s delivered: </span>{service.delivery_method}</p>
                  </div>
                )}
              </>
            ) : (
              <fieldset className="grid gap-3">
                <legend className="sr-only">Package</legend>
                {packages.map((p) => (
                  <label key={p.id} data-platform={p.platform_slug}
                    className="flex min-h-14 cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 has-checked:border-brand has-checked:shadow-2">
                    <input type="radio" name="pkg-choice" value={p.slug} checked={slug === p.slug} onChange={() => choose("package", p.slug)} className="mt-1 size-5 accent-[var(--brand)]" />
                    <span className="flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold">{p.platform_name} · {p.name}</span>
                        <Price usd={p.price_usd} className="font-semibold" />
                      </span>
                      <span className="mt-1 block text-sm text-fg-muted">{p.resolved.map((r) => `${fmtInt(r.qty)} ${r.service.name.replace(/^(YouTube|Instagram)\s/, "")}`).join(" · ")}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            {errors.choice && <p role="alert" className="text-sm font-medium text-danger">{errors.choice}</p>}
          </section>

          {/* Step 2 */}
          <section hidden={step !== 1} className="mt-6 grid gap-5">
            <p className="flex items-start gap-2 rounded-md bg-brand-soft p-3 text-sm text-fg">
              <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />
              We only need a public link. We will never ask for your password or account access.
            </p>
            {linkTypes.map((t) => (
              <Field key={t} id={`o-link-${t}`} label={`Your ${LINK_LABEL[t]}`} hint={`Example: ${LINK_EXAMPLES[t]}`} error={errors[`link_${t}`]}>
                <Input id={`o-link-${t}`} name={`link_${t}`} type="url" inputMode="url" autoComplete="url" placeholder={LINK_EXAMPLES[t]}
                  value={links[t] ?? ""} onChange={(e) => setLinks((l) => ({ ...l, [t]: e.target.value }))}
                  {...describedBy(`o-link-${t}`, errors[`link_${t}`])} />
              </Field>
            ))}
            {(service?.requirements.length ?? 0) > 0 && (
              <ul className="grid gap-1.5 text-sm text-fg-muted">
                {service!.requirements.map((r) => <li key={r} className="flex gap-2"><Check aria-hidden className="mt-0.5 size-4 shrink-0 text-brand" />{r}</li>)}
              </ul>
            )}
          </section>

          {/* Step 3 */}
          <section hidden={step !== 2} className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field id="o-name" label="Name" error={errors.name}>
              <Input id="o-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} {...describedBy("o-name", errors.name)} />
            </Field>
            <Field id="o-email" label="Email" hint="Order updates and payment details go here." error={errors.email}>
              <Input id="o-email" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} {...describedBy("o-email", errors.email)} />
            </Field>
            <Field id="o-country" label="Country" error={errors.country}>
              <Select id="o-country" name="country" autoComplete="country" value={country} onChange={(e) => setCountry(e.target.value)} {...describedBy("o-country", errors.country)}>
                <option value="">Choose…</option>
                {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </Select>
            </Field>
            <Field id="o-phone" label="Phone or WhatsApp" optional hint="Include the country code, e.g. +1 555 123 4567." error={errors.phone}>
              <Input id="o-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} {...describedBy("o-phone", errors.phone)} />
            </Field>
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-start gap-3 text-sm text-fg">
                <input type="checkbox" name="terms" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-[var(--brand)]" aria-describedby={errors.terms ? "o-terms-error" : undefined} />
                <span>
                  I agree to the <Link href="/legal/terms" target="_blank" className="font-medium text-brand underline underline-offset-2">Terms of Service</Link> and{" "}
                  <Link href="/legal/refund-refill" target="_blank" className="font-medium text-brand underline underline-offset-2">Refund &amp; Refill Policy</Link>, and understand platforms may remove engagement over time.
                </span>
              </label>
              {errors.terms && <p id="o-terms-error" role="alert" className="mt-1.5 text-sm font-medium text-danger">{errors.terms}</p>}
            </div>
          </section>

          {/* Step 4 */}
          <section hidden={step !== 3} className="mt-6">
            <dl className="divide-y divide-border rounded-lg border border-border bg-surface">
              <Row k="Item">{service ? `${fmtInt(qty)} × ${service.name}` : pkg ? `${pkg.platform_name} · ${pkg.name} package` : "—"}</Row>
              {linkTypes.map((t) => <Row key={t} k={LINK_LABEL[t]}><span className="break-all">{links[t]}</span></Row>)}
              <Row k="Contact">{name} · {email}{phone ? ` · ${phone}` : ""}</Row>
              <Row k="Total"><Price usd={totalUsd} className="text-lg font-semibold" /></Row>
            </dl>
            <p className="mt-4 rounded-md bg-surface-2 p-3 text-sm text-fg-muted">
              <span className="font-semibold text-fg">Payment: </span>after you place the order we&rsquo;ll email payment details. Work starts once payment is confirmed. Prices are charged in USD; other currencies are shown for reference.
            </p>
          </section>

          {state.status === "error" && !Object.keys(state.fieldErrors ?? {}).length && (
            <p role="alert" className="mt-6 rounded-md border border-danger/30 bg-danger/8 p-3 text-sm font-medium text-danger">{state.message}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={back}><ArrowLeft aria-hidden />Back</Button>
            ) : <span />}
            {step < 3 ? (
              <Button type="button" size="lg" onClick={next}>Continue <ArrowRight aria-hidden /></Button>
            ) : (
              <SubmitButton />
            )}
          </div>
        </form>
      </div>

      {/* Summary */}
      <aside className="lg:col-span-4">
        <div className="rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-24">
          <p className="text-overline font-semibold text-fg-subtle uppercase">Summary</p>
          <p className="mt-2 font-semibold">{service ? service.name : pkg ? `${pkg.name} package` : "Nothing selected"}</p>
          {service && <p className="text-sm text-fg-muted">{fmtInt(Number.isInteger(qty) ? qty : 0)} units</p>}
          <p className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm text-fg-muted">Total</span>
            <Price usd={totalUsd} className="text-2xl font-semibold" />
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 p-4 sm:grid-cols-3">
      <dt className="text-sm text-fg-muted capitalize">{k}</dt>
      <dd className="font-medium text-fg sm:col-span-2">{children}</dd>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? "Placing order…" : "Place order"}
    </Button>
  );
}
