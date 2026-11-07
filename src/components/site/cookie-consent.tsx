"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import { X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useConsent, type ConsentState } from "@/components/shared/consent";
import { Button } from "@/components/ui/button";

export function CookieConsent() {
  const { consent, ready, prefsOpen, openPrefs, save } = useConsent();
  const showBanner = ready && consent === null && !prefsOpen;

  return (
    <>
      {showBanner && (
        <section
          aria-label="Cookie consent"
          className="fixed inset-x-3 bottom-[5.5rem] z-40 rounded-lg border border-border bg-surface p-4 shadow-3 md:inset-x-auto md:bottom-6 md:left-6 md:max-w-md md:p-5"
        >
          <p className="text-sm leading-relaxed text-fg">
            We use necessary cookies to run this site. With your permission we&rsquo;d also use analytics cookies to improve it.
            We never sell your data. <Link href="/legal/cookies" className="font-medium text-brand underline underline-offset-2">Cookie policy</Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => save({ analytics: true, marketing: true })}>Accept all</Button>
            <Button size="sm" variant="secondary" onClick={() => save({ analytics: false, marketing: false })}>Necessary only</Button>
            <Button size="sm" variant="ghost" onClick={() => openPrefs(true)}>Choose</Button>
          </div>
        </section>
      )}
      <PreferencesDialog />
    </>
  );
}

const CATEGORIES: { key: keyof ConsentState | "necessary"; title: string; body: string }[] = [
  { key: "necessary", title: "Necessary", body: "Currency choice, theme, security and this consent choice. Always on." },
  { key: "analytics", title: "Analytics", body: "Anonymous usage statistics that help us improve the site." },
  { key: "marketing", title: "Marketing", body: "Ad measurement and remarketing. Off when your browser sends Global Privacy Control." },
];

function PreferencesDialog() {
  const { consent, gpc, prefsOpen, openPrefs, save } = useConsent();
  const [draft, setDraft] = useState<ConsentState>({ analytics: false, marketing: false });

  return (
    <Dialog.Root
      open={prefsOpen}
      onOpenChange={(o) => {
        if (o) setDraft(consent ?? { analytics: false, marketing: false });
        openPrefs(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-fg/30" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface p-5 shadow-3 focus:outline-none md:p-6">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="font-display text-xl font-semibold">Cookie preferences</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="-mt-2 -mr-2" aria-label="Close">
                <X aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-fg-muted">Choose which cookies we may use. You can change this any time from the footer.</Dialog.Description>
          <ul className="mt-5 divide-y divide-border">
            {CATEGORIES.map((c) => {
              const locked = c.key === "necessary" || (c.key === "marketing" && gpc);
              const checked = c.key === "necessary" ? true : locked ? false : draft[c.key];
              const id = `consent-${c.key}`;
              return (
                <li key={c.key} className="flex items-start justify-between gap-4 py-4">
                  <div>
                    <label htmlFor={id} className="font-semibold text-fg">{c.title}</label>
                    <p className="mt-0.5 text-sm text-fg-muted">{c.body}</p>
                  </div>
                  <Switch.Root
                    id={id}
                    checked={checked}
                    disabled={locked}
                    onCheckedChange={(v) => c.key !== "necessary" && setDraft((d) => ({ ...d, [c.key]: v }))}
                    className="relative mt-1 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border-strong bg-surface-2 transition-colors data-[state=checked]:border-brand data-[state=checked]:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Switch.Thumb className="block size-5 translate-x-1 rounded-full bg-surface shadow-1 transition-transform data-[state=checked]:translate-x-6" />
                  </Switch.Root>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => save({ analytics: false, marketing: false })}>Reject all</Button>
            <Button onClick={() => save(draft)}>Save choices</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function CookieSettingsButton() {
  const { openPrefs } = useConsent();
  return (
    <button type="button" onClick={() => openPrefs(true)} className="inline-flex min-h-11 cursor-pointer items-center text-left hover:text-fg">
      Cookie settings
    </button>
  );
}
