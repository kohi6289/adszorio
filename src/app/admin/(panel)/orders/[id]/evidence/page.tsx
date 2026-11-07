import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getSiteSettings } from "@/lib/data";
import { fmtDateTime, fmtInt, fmtUsd, label } from "@/lib/format";
import type { Order } from "@/types/models";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Dispute evidence" };

/** Printable chargeback evidence. Use the browser's "Save as PDF". */
export default async function Evidence({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await requireAdmin();
  const [{ data }, settings] = await Promise.all([
    db.from("orders").select("*, services(name,delivery_method), packages(name)").eq("id", id).maybeSingle(),
    getSiteSettings(),
  ]);
  if (!data) notFound();
  const o = data as Order & { services: { name: string; delivery_method: string } | null; packages: { name: string } | null; terms_accepted_at: string };
  const proofs = await Promise.all((o.delivery_proof_urls ?? []).filter((p) => !p.endsWith(".pdf")).map(async (p) => (await db.storage.from("order-proofs").createSignedUrl(p, 3600)).data?.signedUrl));
  const utc = (iso: string) => fmtDateTime(iso, "UTC");
  const rows: [string, string][] = [
    ["Order code", o.order_code], ["Placed", utc(o.created_at)], ["Terms accepted", utc(o.terms_accepted_at)],
    ["Customer", `${o.customer_name} <${o.email}>${o.phone ? ` ${o.phone}` : ""}`], ["Country (stated / IP)", `${o.country ?? "—"} / ${o.ip_country ?? "—"}`],
    ["Service", o.services ? `${fmtInt(o.quantity)} × ${o.services.name}` : `${o.packages?.name} package`],
    ["Target link", o.target_link], ["Amount", `${fmtUsd(o.amount_usd)}${o.currency !== "USD" ? ` (displayed ${Number(o.amount).toFixed(2)} ${o.currency})` : ""}`],
    ["Payment", `${label(o.payment_status)}${o.payment_method ? ` via ${o.payment_method}` : ""}${o.payment_ref ? ` · ref ${o.payment_ref}` : ""}`],
    ["Start count", o.start_count === null ? "—" : fmtInt(o.start_count)], ["Count after delivery", o.delivered_count === null ? "—" : fmtInt(o.delivered_count)],
    ["Delivery method (shown to customer)", o.services?.delivery_method ?? "See package services"],
  ];
  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-black print:p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{settings.brand} — order evidence</h1>
          <p className="text-sm">Generated {utc(new Date().toISOString())} · {settings.domain}</p>
        </div>
        <PrintButton />
      </div>
      <table className="mt-6 w-full border-collapse text-sm">
        <tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-gray-300 align-top"><th className="w-1/3 py-2 pr-4 text-left font-semibold">{k}</th><td className="py-2 break-all whitespace-pre-line">{v}</td></tr>)}</tbody>
      </table>
      <h2 className="mt-6 font-bold">Status history (UTC)</h2>
      <ol className="mt-2 list-decimal pl-6 text-sm">{o.status_history.map((h, i) => <li key={i}>{utc(h.at)} — {label(h.status)}{h.note ? ` (${h.note})` : ""}</li>)}</ol>
      {proofs.length > 0 && (
        <>
          <h2 className="mt-6 font-bold">Delivery proof</h2>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {proofs.map((u, i) => u && <img key={i} src={u} alt={`Proof ${i + 1}`} className="w-full border border-gray-300" />)}
          </div>
        </>
      )}
    </main>
  );
}
