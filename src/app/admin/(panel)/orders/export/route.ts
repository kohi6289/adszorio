import { requireAdmin } from "@/lib/admin/auth";
import { toCsv } from "@/lib/admin/csv";
import { itemName, orderQuery } from "../query";

export async function GET(req: Request) {
  const { db } = await requireAdmin();
  const f = Object.fromEntries(new URL(req.url).searchParams);
  const { data, error } = await orderQuery(db, f).limit(10000);
  if (error) return new Response(error.message, { status: 500 });
  const rows = ((data ?? []) as unknown as (Record<string, unknown> & { quantity: number; services: unknown; packages: unknown })[]).map((o) => ({ ...o, item: itemName(o) }));
  const csv = toCsv(rows, ["order_code", "created_at", "status", "payment_status", "payment_method", "customer_name", "email", "phone", "country", "ip_country", "item", "target_link", "amount_usd", "currency", "amount", "requires_review", "risk_flags"]);
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="adszorio-orders-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
