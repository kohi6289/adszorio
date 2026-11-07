"use client";

import { CheckCircle2 } from "lucide-react";
import { useConsent } from "@/components/shared/consent";
import { Button } from "@/components/ui/button";

export function DoNotSellPanel() {
  const { consent, ready, gpc, save } = useConsent();
  const optedOut = gpc || (consent !== null && !consent.marketing);

  if (!ready) return <div className="mt-8 h-24 rounded-lg bg-surface-2" aria-hidden />;

  return (
    <div className="mt-8 rounded-lg border border-border bg-surface p-5" aria-live="polite">
      {optedOut ? (
        <p className="flex items-start gap-3 font-medium text-fg">
          <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-success" />
          You are opted out of the sale or sharing of your personal information{gpc ? " (Global Privacy Control detected)" : ""}.
        </p>
      ) : (
        <>
          <p className="text-fg">Marketing cookies are currently allowed on this browser.</p>
          <Button className="mt-4" onClick={() => save({ analytics: consent?.analytics ?? false, marketing: false })}>
            Opt out of sale or sharing
          </Button>
        </>
      )}
    </div>
  );
}
