import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, Panel, TableWrap, td, th } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/auth";
import { adminDate, adminTz } from "@/lib/admin/tz";
import { countryName } from "@/lib/countries";
import { fmtUsd } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

type O = { id: string; order_code: string; created_at: string; amount_usd: number; status: string; payment_status: string; country: string | null; requires_review: boolean; customer_name: string; services: { categories: { platforms: { name: string } } } | null; packages: { platforms: { name: string } } | null };

/** Request time. Server components render once per request, so reading the clock here is intended. */
const requestTime = () => Date.now();

export default async function Overview() {
  const { db } = await requireAdmin();
  const now = requestTime();
  const since = new Date(now - 30 * 86400_000).toISOString();
  const [{ data: ordersRaw }, { count: newLeads }, { count: openPrivacy }, { data: recentLeads }, fmt, tz] = await Promise.all([
    db.from("orders").select("id,order_code,created_at,amount_usd,status,payment_status,country,requires_review,customer_name,services(categories(platforms(name))),packages(platforms(name))").gte("created_at", since).order("created_at", { ascending: false }),
    db.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("data_requests").select("id", { count: "exact", head: true }).eq("status", "received"),
    db.from("leads").select("id,name,company,created_at").order("created_at", { ascending: false }).limit(5),
    adminDate(),
    adminTz(),
  ]);
  const orders = (ordersRaw ?? []) as unknown as O[];

  // Day boundaries in the admin's chosen time zone (IST or UTC).
  const dayKey = (iso: string | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
  const today = dayKey(new Date(now));
  const paid = (o: O) => o.payment_status === "paid";
  const revenue = (days: number) => {
    const cutoff = now - days * 86400_000;
    return orders.filter((o) => paid(o) && new Date(o.created_at).getTime() >= cutoff).reduce((a, o) => a + Number(o.amount_usd), 0);
  };
  const kpis = [
    { label: "Orders today", value: String(orders.filter((o) => dayKey(o.created_at) === today).length), href: "/admin/orders" },
    { label: "Paid revenue today", value: fmtUsd(orders.filter((o) => paid(o) && dayKey(o.created_at) === today).reduce((a, o) => a + Number(o.amount_usd), 0)) },
    { label: "Paid revenue 7 days", value: fmtUsd(revenue(7)) },
    { label: "Paid revenue 30 days", value: fmtUsd(revenue(30)) },
    { label: "Awaiting payment", value: String(orders.filter((o) => o.payment_status === "unpaid" && o.status === "pending").length), href: "/admin/orders?payment=unpaid&status=pending" },
    { label: "Flagged for review", value: String(orders.filter((o) => o.requires_review).length), href: "/admin/orders?flagged=1", warn: true },
    { label: "New leads", value: String(newLeads ?? 0), href: "/admin/leads" },
    { label: "Open privacy requests", value: String(openPrivacy ?? 0), href: "/admin/data_requests" },
  ];

  // 14-day revenue bars
  const days = Array.from({ length: 14 }, (_, i) => dayKey(new Date(now - (13 - i) * 86400_000)));
  const byDay = days.map((d) => ({ d, v: orders.filter((o) => paid(o) && dayKey(o.created_at) === d).reduce((a, o) => a + Number(o.amount_usd), 0), n: orders.filter((o) => dayKey(o.created_at) === d).length }));
  const maxV = Math.max(1, ...byDay.map((x) => x.v));

  const platformOf = (o: O) => o.services?.categories?.platforms?.name ?? o.packages?.platforms?.name ?? "Other";
  const group = (key: (o: O) => string) => [...orders.reduce((m, o) => m.set(key(o), { n: (m.get(key(o))?.n ?? 0) + 1, v: (m.get(key(o))?.v ?? 0) + Number(o.amount_usd) }), new Map<string, { n: number; v: number }>())].sort((a, b) => b[1].n - a[1].n);

  return (
    <>
      <AdminHeader title="Dashboard" intro={`Last 30 days · times in ${tz === "UTC" ? "UTC" : "IST"} · revenue counts paid orders only`} />
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const body = (
            <>
              <p className="text-xs font-medium text-fg-muted">{k.label}</p>
              <p className={`mt-1 font-mono text-xl font-semibold tabular-nums ${k.warn && k.value !== "0" ? "text-warning" : ""}`}>{k.value}</p>
            </>
          );
          return <li key={k.label} className="rounded-lg border border-border bg-surface">{k.href ? <Link href={k.href} className="block p-3 hover:bg-surface-2/60">{body}</Link> : <div className="p-3">{body}</div>}</li>;
        })}
      </ul>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Paid revenue, last 14 days" className="lg:col-span-2">
          <div className="flex h-40 items-end gap-1" role="img" aria-label={`Revenue by day: ${byDay.map((b) => `${b.d} ${fmtUsd(b.v)}`).join(", ")}`}>
            {byDay.map((b) => (
              <div key={b.d} className="flex flex-1 flex-col items-center gap-1" title={`${b.d}: ${fmtUsd(b.v)} · ${b.n} orders`}>
                <div className="w-full rounded-t-sm bg-brand" style={{ height: `${Math.max(2, (b.v / maxV) * 140)}px`, opacity: b.v ? 1 : 0.25 }} />
                <span className="font-mono text-[0.625rem] text-fg-subtle">{b.d.slice(8)}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Orders by platform">
          <ul className="grid gap-2 text-sm">
            {group(platformOf).map(([k, x]) => <li key={k} className="flex justify-between"><span>{k}</span><span className="font-mono">{x.n} · {fmtUsd(x.v)}</span></li>)}
            {orders.length === 0 && <li className="text-fg-subtle">No orders yet.</li>}
          </ul>
          <h3 className="mt-5 text-sm font-semibold">Top countries</h3>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {group((o) => o.country ?? "—").slice(0, 8).map(([k, x]) => <li key={k} className="flex justify-between"><span>{countryName(k) || k}</span><span className="font-mono">{x.n}</span></li>)}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold">Recent orders</h2>
          <TableWrap>
            <table className="w-full">
              <thead className="border-b border-border bg-surface-2"><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={`${th} text-right`}>USD</th><th className={th}>Status</th><th className={th}>Placed</th></tr></thead>
              <tbody className="divide-y divide-border">
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id}>
                    <td className={td}><Link href={`/admin/orders/${o.id}`} className="inline-flex min-h-10 items-center gap-1 font-mono font-semibold whitespace-nowrap hover:underline">{o.requires_review && <AlertTriangle aria-label="Flagged" className="size-3.5 text-warning" />}{o.order_code}</Link></td>
                    <td className={td}>{o.customer_name}</td>
                    <td className={`${td} text-right font-mono`}>{fmtUsd(Number(o.amount_usd))}</td>
                    <td className={td}><StatusBadge status={o.status} /></td>
                    <td className={`${td} whitespace-nowrap`}>{fmt(o.created_at)}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td className={td} colSpan={5}>No orders in the last 30 days.</td></tr>}
              </tbody>
            </table>
          </TableWrap>
        </div>
        <Panel title="Latest leads">
          <ul className="grid gap-2 text-sm">
            {(recentLeads ?? []).map((l) => <li key={l.id}><Link href={`/admin/leads/${l.id}`} className="inline-flex min-h-10 items-center font-medium hover:underline">{l.name}{l.company ? ` · ${l.company}` : ""}</Link><span className="block text-xs text-fg-subtle">{fmt(l.created_at)}</span></li>)}
            {!recentLeads?.length && <li className="text-fg-subtle">No leads yet.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
