import { requireAdmin } from "@/lib/admin/auth";
import { toCsv } from "@/lib/admin/csv";

export async function GET() {
  const { db } = await requireAdmin();
  const { data, error } = await db.from("leads").select("*").order("created_at", { ascending: false }).limit(10000);
  if (error) return new Response(error.message, { status: 500 });
  const csv = toCsv(data ?? [], ["created_at", "status", "name", "email", "phone", "company", "country", "platform_interest", "budget_range_usd", "message", "notes", "source_page", "utm"]);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="adszorio-leads-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
