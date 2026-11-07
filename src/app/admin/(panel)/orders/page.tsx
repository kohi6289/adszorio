import { AlertTriangle, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, Notice, TableWrap, td, th } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { requireAdmin } from "@/lib/admin/auth";
import { bulkSetStatus } from "@/lib/admin/order-actions";
import { adminDate } from "@/lib/admin/tz";
import { fmtUsd, label } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/types/models";
import { itemName, orderQuery, type OrderFilters } from "./query";

export const metadata: Metadata = { title: "Orders" };
const PAGE = 50;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<OrderFilters & { saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const { db } = await requireAdmin();
  const page = Math.max(1, Number(sp.page) || 1);
  const [{ data, count, error }, fmt] = await Promise.all([orderQuery(db, sp).range((page - 1) * PAGE, page * PAGE - 1), adminDate()]);
  if (error) throw new Error(error.message);
  const orders = (data ?? []) as unknown as (Record<string, unknown> & { id: string; quantity: number; services: unknown; packages: unknown })[];
  const filters = new URLSearchParams(Object.entries(sp).filter(([k, v]) => v && !["saved", "error", "page"].includes(k)) as [string, string][]).toString();
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE));

  return (
    <>
      <AdminHeader
        title="Orders"
        intro={`${count ?? 0} order${count === 1 ? "" : "s"} match.`}
        actions={<Button asChild variant="secondary" size="sm"><a href={`/admin/orders/export?${filters}`}><Download aria-hidden />Export CSV</a></Button>}
      />
      {sp.saved && <Notice>{sp.saved}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <form className="mb-4 grid gap-2 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-7" role="search">
        <div className="lg:col-span-2"><label htmlFor="o-q" className="sr-only">Search</label><Input id="o-q" name="q" defaultValue={sp.q} placeholder="Code, email or name" className="h-11" /></div>
        <Select aria-label="Status" name="status" defaultValue={sp.status ?? ""} className="h-11"><option value="">Any status</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
        <Select aria-label="Payment" name="payment" defaultValue={sp.payment ?? ""} className="h-11"><option value="">Any payment</option>{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
        <Input aria-label="From date" type="date" name="from" defaultValue={sp.from} className="h-11" />
        <Input aria-label="To date" type="date" name="to" defaultValue={sp.to} className="h-11" />
        <div className="flex items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" name="flagged" value="1" defaultChecked={sp.flagged === "1"} className="size-5 accent-[var(--brand)]" />Flagged</label>
          <Button type="submit" size="sm" className="ml-auto">Filter</Button>
        </div>
      </form>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong p-8 text-center text-sm text-fg-muted">No orders match. {filters && <Link href="/admin/orders" className="font-semibold text-brand">Clear filters</Link>}</p>
      ) : (
        <form action={bulkSetStatus}>
          <input type="hidden" name="return" value={filters} />
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-fg-muted">Selected orders →</span>
            <Select aria-label="Bulk status" name="bulk_status" defaultValue="" className="h-10 w-48"><option value="" disabled>Set status…</option>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
            <Button type="submit" size="sm" variant="secondary">Apply</Button>
          </div>

          <div className="hidden md:block">
            <TableWrap>
              <table className="w-full">
                <thead className="border-b border-border bg-surface-2"><tr>
                  <th className={th}><span className="sr-only">Select</span></th>
                  <th className={th}>Order</th><th className={th}>Placed</th><th className={th}>Customer</th><th className={th}>Item</th>
                  <th className={`${th} text-right`}>USD</th><th className={th}>Status</th><th className={th}>Payment</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-2/50">
                      <td className={td}><label className="-m-2 flex size-10 cursor-pointer items-center justify-center"><input type="checkbox" name="ids" value={o.id} aria-label={`Select ${o.order_code}`} className="size-5 accent-[var(--brand)]" /></label></td>
                      <td className={td}>
                        <Link href={`/admin/orders/${o.id}`} className="inline-flex min-h-10 items-center gap-1.5 font-mono font-semibold whitespace-nowrap hover:underline">
                          {o.requires_review ? <AlertTriangle aria-label="Flagged for review" className="size-4 text-warning" /> : null}{String(o.order_code)}
                        </Link>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{fmt(o.created_at as string)}</td>
                      <td className={td}><span className="block font-medium">{String(o.customer_name)}</span><span className="text-xs text-fg-muted">{String(o.email)} · {String(o.country ?? "")}</span></td>
                      <td className={td}>{itemName(o)}</td>
                      <td className={`${td} text-right font-mono`}>{fmtUsd(Number(o.amount_usd))}</td>
                      <td className={td}><StatusBadge status={String(o.status)} /></td>
                      <td className={td}><StatusBadge status={String(o.payment_status)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>

          <ul className="grid gap-2 md:hidden">
            {orders.map((o) => (
              <li key={o.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <label className="flex min-h-11 items-center gap-2">
                    <input type="checkbox" name="ids" value={o.id} className="size-5 accent-[var(--brand)]" aria-label={`Select ${o.order_code}`} />
                    <Link href={`/admin/orders/${o.id}`} className="inline-flex items-center gap-1.5 font-mono font-semibold">
                      {o.requires_review ? <AlertTriangle aria-label="Flagged" className="size-4 text-warning" /> : null}{String(o.order_code)}
                    </Link>
                  </label>
                  <span className="font-mono text-sm font-semibold">{fmtUsd(Number(o.amount_usd))}</span>
                </div>
                <p className="text-sm">{itemName(o)}</p>
                <p className="text-xs text-fg-muted">{String(o.customer_name)} · {String(o.email)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge status={String(o.status)} /><StatusBadge status={String(o.payment_status)} /><span className="text-xs text-fg-subtle">{fmt(o.created_at as string)}</span></div>
              </li>
            ))}
          </ul>
        </form>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center gap-2 text-sm">
          {page > 1 && <Button asChild size="sm" variant="secondary"><Link href={`/admin/orders?${filters}&page=${page - 1}`}>Previous</Link></Button>}
          <span className="text-fg-muted">Page {page} of {pages}</span>
          {page < pages && <Button asChild size="sm" variant="secondary"><Link href={`/admin/orders?${filters}&page=${page + 1}`}>Next</Link></Button>}
        </nav>
      )}
    </>
  );
}
