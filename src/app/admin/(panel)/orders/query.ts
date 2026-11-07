import "server-only";
import type { requireAdmin } from "@/lib/admin/auth";

type Db = Awaited<ReturnType<typeof requireAdmin>>["db"];
export interface OrderFilters { q?: string; status?: string; payment?: string; flagged?: string; from?: string; to?: string; page?: string }

export const ORDER_SELECT = "id,order_code,created_at,customer_name,email,phone,country,ip_country,quantity,amount_usd,amount,currency,status,payment_status,payment_method,requires_review,risk_flags,target_link,services(name),packages(name)";

export function orderQuery(db: Db, f: OrderFilters, select = ORDER_SELECT) {
  let q = db.from("orders").select(select, { count: "exact" }).order("created_at", { ascending: false });
  if (f.q) {
    const term = f.q.replace(/[%_,()]/g, "").trim();
    if (term) q = q.or(`order_code.ilike.%${term}%,email.ilike.%${term}%,customer_name.ilike.%${term}%`);
  }
  if (f.status) q = q.eq("status", f.status);
  if (f.payment) q = q.eq("payment_status", f.payment);
  if (f.flagged === "1") q = q.eq("requires_review", true);
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00Z`);
  if (f.to) q = q.lte("created_at", `${f.to}T23:59:59Z`);
  return q;
}

export const itemName = (o: { services: unknown; packages: unknown; quantity: number }) => {
  const s = o.services as { name: string } | null;
  const p = o.packages as { name: string } | null;
  return s ? `${o.quantity.toLocaleString("en-US")} × ${s.name}` : `${p?.name ?? "?"} package`;
};
