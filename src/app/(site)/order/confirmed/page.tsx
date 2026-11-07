import { CheckCircle2, Mail } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { LocalTime } from "@/components/shared/local-time";
import { Container } from "@/components/shared/section";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fmtInt, fmtUsd } from "@/lib/format";
import { ORDER_COOKIE } from "@/lib/order";
import { hasSupabase } from "@/lib/supabase/env";
import { serviceClient } from "@/lib/supabase/service";

export const metadata: Metadata = { title: "Order received", robots: { index: false } };

export default async function ConfirmedPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const own = (await cookies()).get(ORDER_COOKIE)?.value;
  // Only the browser that placed the order sees its details here; anyone else is sent to tracking.
  const { data: order } = code && own === code && hasSupabase()
    ? await serviceClient().from("orders")
        .select("order_code,email,quantity,amount,amount_usd,currency,status,created_at,target_link,services(name),packages(name)")
        .eq("order_code", code).maybeSingle()
    : { data: null };

  const item = order ? ((order.services as unknown as { name: string } | null)?.name ?? `${(order.packages as unknown as { name: string } | null)?.name} package`) : "";

  return (
    <Container className="max-w-[720px] py-14 md:py-20">
      <CheckCircle2 aria-hidden className="size-12 text-success" />
      <h1 className="mt-4 font-display text-display-xl font-semibold">Order received</h1>
      {order ? (
        <>
          <p className="mt-3 text-lg text-fg-muted">
            Your order code is <span className="font-mono font-semibold text-fg">{order.order_code}</span>. We&rsquo;ve sent a confirmation to <span className="font-semibold text-fg">{order.email}</span>.
          </p>
          <dl className="mt-8 divide-y divide-border rounded-lg border border-border bg-surface">
            <div className="flex justify-between gap-4 p-4"><dt className="text-fg-muted">Item</dt><dd className="text-right font-medium">{order.services ? `${fmtInt(order.quantity)} × ` : ""}{item}</dd></div>
            <div className="flex justify-between gap-4 p-4"><dt className="text-fg-muted">Link</dt><dd className="text-right font-medium break-all whitespace-pre-line">{order.target_link}</dd></div>
            <div className="flex justify-between gap-4 p-4"><dt className="text-fg-muted">Total</dt><dd className="text-right font-mono font-semibold">{fmtUsd(Number(order.amount_usd))}{order.currency !== "USD" && <span className="block text-xs font-normal text-fg-muted">≈ {Number(order.amount).toFixed(2)} {order.currency}</span>}</dd></div>
            <div className="flex justify-between gap-4 p-4"><dt className="text-fg-muted">Status</dt><dd><StatusBadge status={order.status} /></dd></div>
            <div className="flex justify-between gap-4 p-4"><dt className="text-fg-muted">Placed</dt><dd className="text-right"><LocalTime iso={order.created_at} /></dd></div>
          </dl>
        </>
      ) : (
        <p className="mt-3 text-lg text-fg-muted">Thanks! Check your email for your order code and payment details.</p>
      )}
      <div className="mt-8 rounded-lg bg-brand-soft p-5">
        <p className="flex items-center gap-2 font-semibold text-fg"><Mail aria-hidden className="size-5 text-brand" />What happens next</p>
        <ol className="mt-2 list-decimal space-y-1 pl-6 text-fg-muted">
          <li>We email you payment details (usually within support hours).</li>
          <li>Once payment is confirmed, we record your starting count and begin.</li>
          <li>Track progress any time with your order code and email.</li>
        </ol>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link href={`/track${order ? `?code=${order.order_code}` : ""}`}>Track order</Link></Button>
        <Button asChild size="lg" variant="secondary"><Link href="/services">Back to services</Link></Button>
      </div>
    </Container>
  );
}
