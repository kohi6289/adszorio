"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CURRENCY_COOKIE, convertFromUsd, formatMoney } from "@/lib/currency";
import type { Currency } from "@/types/models";

interface CurrencyCtx {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (code: string) => void;
  /** Convert a USD amount to the active currency and format it (display only). */
  format: (usd: number) => string;
}

const Ctx = createContext<CurrencyCtx | null>(null);

export function CurrencyProvider({
  currencies,
  initialCode,
  children,
}: {
  currencies: Currency[];
  initialCode: string;
  children: ReactNode;
}) {
  const [code, setCode] = useState(initialCode);
  const currency = currencies.find((c) => c.code === code) ?? currencies[0];

  const setCurrency = useCallback((next: string) => {
    setCode(next);
    // 1 year, readable by the server on the next request
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<CurrencyCtx>(
    () => ({
      currency,
      currencies,
      setCurrency,
      format: (usd) => formatMoney(convertFromUsd(usd, currency), currency.code),
    }),
    [currency, currencies, setCurrency],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}
