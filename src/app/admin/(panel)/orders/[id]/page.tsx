import { AlertTriangle, ExternalLink, FileText, Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Notice, Panel } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { requireAdmin } from "@/lib/admin/auth";
import { approveOrder, setFulfilment, setOrderStatus, setPayment } from "@/lib/admin/order-actions";
import { adminDate } from "@/lib/admin/tz";
import { countryName } from "@/lib/countries";
import { fmtInt, fmtUsd, label } from "@/lib/format";
import { RISK_LABEL, type RiskFlag } from "@/lib/risk";
import { ORDER_STATUSES, PAYMENT_STATUSES, type Order } from "@/types/models";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { db } = await requireAdmin();
  const { data } = await db.from("orders").select("*, services(name,slug,delivery_method,link_type), packages(name,slug)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Order & { services: { name: string; delivery_method: string } | null; packages: { name: string } | null };
  const fmt = await adminDate();
  const proofs = await Promise.all(
    (o.delivery_proof_urls ?? []).map(async (path) => ({ path, url: (await db.storage.from("order-proofs").createSignedUrl(path, 3600)).data?.signedUrl })),
  );
  const item = o.services ? `${fmtInt(o.quantity)} × ${o.services.name}` : `${o.packages?.name} package`;
  const wa = o.phone?.replace(/[^\d]/g, "");
  const delivered = o.start_count !== null && o.delivered_count !== null ? o.delivered_count - o.start_count : null;

  return (
    <div className="max-w-6xl">
      <AdminHeader
        title={o.order_code}
        back={{ href: "/admin/orders", label: "Orders" }}
        actions={<Button asChild variant="secondary" size="sm"><Link href={`/admin/orders/${o.id}/evidence`} target="_blank"><FileText aria-hidden />Dispute evidence</Link></Button>}
      />
      {sp.saved && <Notice>{sp.saved}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      {o.requires_review && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-4">
          <div>
            <p className="flex items-center gap-2 font-semibold text-warning"><AlertTriangle aria-hidden className="size-5" />Flagged for review</p>
            <ul className="mt-1 list-disc pl-6 text-sm">{(o.risk_flags as RiskFlag[]).map((f) => <li key={f}>{RISK_LABEL[f] ?? f}</li>)}</ul>
          </div>
          <form action={approveOrder.bind(null, o.id)}><Button type="submit" size="sm">Approve order</Button></form>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 content-start gap-4 lg:col-span-2">
          <Panel title="Order">
            <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
              <dt className="text-fg-muted">Item</dt><dd className="font-medium">{item}</dd>
              <dt className="text-fg-muted">Link</dt>
              <dd className="grid gap-1">{o.target_link.split("\n").map((l) => {
                const url = l.replace(/^[^:]+: (?=https)/, "");
                return <a key={l} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-brand hover:underline">{l}<ExternalLink aria-hidden className="size-3.5 shrink-0" /></a>;
              })}</dd>
              <dt className="text-fg-muted">Total</dt><dd className="font-mono">{fmtUsd(o.amount_usd)} {o.currency !== "USD" && <span className="text-fg-muted">(shown as {Number(o.amount).toFixed(2)} {o.currency} @ {o.fx_rate})</span>}</dd>
              <dt className="text-fg-muted">Placed</dt><dd>{fmt(o.created_at)}</dd>
              <dt className="text-fg-muted">Status</dt><dd className="flex gap-2"><StatusBadge status={o.status} /><StatusBadge status={o.payment_status} /></dd>
              {o.services && <><dt className="text-fg-muted">Delivery method</dt><dd className="text-fg-muted">{o.services.delivery_method}</dd></>}
            </dl>
          </Panel>

          <Panel title="Change status">
            <form action={setOrderStatus.bind(null, o.id)} className="grid gap-3 sm:grid-cols-[12rem_1fr]">
              <Select aria-label="New status" name="status" defaultValue={o.status} className="h-11">{ORDER_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
              <Input aria-label="Note for the timeline (optional)" name="note" placeholder="Note shown on the customer's timeline (optional)" className="h-11" />
              <label className="flex min-h-11 items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[var(--brand)]" />Email the customer about this change</label>
              <Button type="submit" size="sm" className="justify-self-start">Update status</Button>
            </form>
          </Panel>

          <Panel title="Fulfilment & proof">
            <form action={setFulfilment.bind(null, o.id)} className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold">Start count (before)<Input name="start_count" type="number" min={0} defaultValue={o.start_count ?? ""} className="h-11 font-mono" /></label>
              <label className="grid gap-1 text-sm font-semibold">Count after delivery<Input name="delivered_count" type="number" min={0} defaultValue={o.delivered_count ?? ""} className="h-11 font-mono" /></label>
              {delivered !== null && <p className="text-sm text-fg-muted sm:col-span-2">Delivered: <span className="font-mono font-semibold text-fg">{fmtInt(delivered)}</span> of {fmtInt(o.quantity)}</p>}
              <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Add proof screenshots (PNG/JPG/WebP/PDF, 5 MB each)
                <input type="file" name="proof" multiple accept="image/png,image/jpeg,image/webp,application/pdf" className="text-sm font-normal file:mr-3 file:min-h-10 file:rounded-md file:border file:border-border-strong file:bg-surface-2 file:px-3 file:font-semibold" />
              </label>
              <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Internal notes<Textarea name="admin_notes" rows={3} defaultValue={o.admin_notes ?? ""} /></label>
              <Button type="submit" size="sm" className="justify-self-start">Save fulfilment</Button>
            </form>
            {proofs.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {proofs.map((p) => (
                  <li key={p.path}>
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-border">
                      {/\.pdf$/.test(p.path) ? <span className="grid h-24 place-items-center text-xs">PDF</span> : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.url} alt="Delivery proof" className="h-24 w-full object-cover" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="grid min-w-0 content-start gap-4">
          <Panel title="Customer">
            <p className="font-semibold">{o.customer_name}</p>
            <p className="text-sm break-all">{o.email}</p>
            {o.phone && <p className="font-mono text-sm">{o.phone}</p>}
            <p className="mt-1 text-sm text-fg-muted">{countryName(o.country)} {o.ip_country && o.ip_country !== o.country && <span className="text-warning">(IP: {o.ip_country})</span>}</p>
            {o.customer_timezone && <p className="text-xs text-fg-subtle">Time zone: {o.customer_timezone}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary"><a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your order ${o.order_code}`)}`}><Mail aria-hidden />Email</a></Button>
              {wa && <Button asChild size="sm" variant="secondary"><a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${o.customer_name}, about your order ${o.order_code}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden />WhatsApp</a></Button>}
            </div>
          </Panel>

          <Panel title="Payment">
            <form action={setPayment.bind(null, o.id)} className="grid gap-2">
              <Select aria-label="Payment status" name="payment_status" defaultValue={o.payment_status} className="h-11">{PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
              <Input aria-label="Payment method" name="payment_method" defaultValue={o.payment_method ?? ""} placeholder="Method (e.g. USDT TRC20, Wise)" className="h-11" />
              <Input aria-label="Payment reference" name="payment_ref" defaultValue={o.payment_ref ?? ""} placeholder="Transaction ID / reference" className="h-11 font-mono" />
              <Button type="submit" size="sm" className="justify-self-start">Save payment</Button>
            </form>
          </Panel>

          <Panel title="Timeline">
            <ol className="grid gap-3 text-sm">
              {[...o.status_history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="border-l-2 border-border pl-3">
                  <p className="font-semibold">{label(h.status)}</p>
                  <p className="text-xs text-fg-muted">{fmt(h.at)}{h.note ? ` — ${h.note}` : ""}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
