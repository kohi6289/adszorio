"use client";

import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const DELAY_S = 3;

/**
 * After an order is placed, sends the customer to WhatsApp with their order pre-filled.
 * Redirects once per order (sessionStorage), so coming back from WhatsApp doesn't loop.
 * Automated browsers (e2e tests) are not redirected.
 */
export function WhatsAppRedirect({ href, orderKey }: { href: string; orderKey: string }) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const key = `adz-wa-${orderKey}`;
    let done = false;
    try { done = sessionStorage.getItem(key) === "1"; } catch {}
    if (done || navigator.webdriver) return;
    const start = Date.now();
    const update = () => setLeft(Math.max(0, DELAY_S - Math.floor((Date.now() - start) / 1000)));
    const first = setTimeout(update, 0);
    const tick = setInterval(update, 250);
    const go = setTimeout(() => {
      try { sessionStorage.setItem(key, "1"); } catch {}
      window.location.href = href;
    }, DELAY_S * 1000);
    return () => { clearTimeout(first); clearInterval(tick); clearTimeout(go); };
  }, [href, orderKey]);

  return (
    <div className="mt-8 rounded-lg border border-success/30 bg-success/8 p-5">
      <p className="font-semibold text-fg">Next step: send us your order on WhatsApp</p>
      <p className="mt-1 text-fg-muted">
        We share payment details on WhatsApp. Your message is already written — just tap send.
        {left !== null && left > 0 && <span aria-live="polite"> Opening WhatsApp in {left}s…</span>}
      </p>
      <Button asChild size="lg" className="mt-4">
        <a href={href} onClick={() => { try { sessionStorage.setItem(`adz-wa-${orderKey}`, "1"); } catch {} }}>
          <MessageCircle aria-hidden />Send order on WhatsApp
        </a>
      </Button>
    </div>
  );
}
