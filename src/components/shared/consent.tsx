"use client";

import Script, { type ScriptProps } from "next/script";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Cookie consent. "necessary" is always on; analytics and marketing are opt-in.
// Global Privacy Control (GPC) is honoured as an opt-out of marketing / "sale or sharing".

export const CONSENT_COOKIE = "adz_consent";
const VERSION = 1;

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
}

interface ConsentCtx {
  /** null until the visitor has made a choice (and always null before mount) */
  consent: ConsentState | null;
  /** true once the stored choice has been read in the browser */
  ready: boolean;
  gpc: boolean;
  save: (next: ConsentState) => void;
  prefsOpen: boolean;
  openPrefs: (open: boolean) => void;
}

const Ctx = createContext<ConsentCtx | null>(null);

function readCookie(): ConsentState | null {
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.split("=")[1]));
    if (parsed.v !== VERSION) return null;
    return { analytics: !!parsed.a, marketing: !!parsed.m };
  } catch {
    return null;
  }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [gpc, setGpc] = useState(false);
  const [prefsOpen, openPrefs] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Cookies and navigator only exist in the browser, so the stored choice is read after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    setConsent(readCookie());
    setGpc(Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const save = useCallback(
    (next: ConsentState) => {
      const value: ConsentState = { analytics: next.analytics, marketing: gpc ? false : next.marketing };
      setConsent(value);
      const payload = encodeURIComponent(JSON.stringify({ v: VERSION, a: value.analytics, m: value.marketing }));
      document.cookie = `${CONSENT_COOKIE}=${payload}; path=/; max-age=15552000; samesite=lax`;
      openPrefs(false);
    },
    [gpc],
  );

  const value = useMemo(() => ({ consent, ready, gpc, save, prefsOpen, openPrefs }), [consent, ready, gpc, save, prefsOpen]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useConsent() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConsent must be used inside <ConsentProvider>");
  return ctx;
}

/** Renders a third-party script only after the visitor granted the given category. */
export function ConsentScript({ category, ...props }: ScriptProps & { category: keyof ConsentState }) {
  const { consent } = useConsent();
  if (!consent?.[category]) return null;
  return <Script {...props} />;
}
