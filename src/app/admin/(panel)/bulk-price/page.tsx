import type { Metadata } from "next";
import { AdminHeader, Notice, TableWrap, td, th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { requireAdmin } from "@/lib/admin/auth";
import { applyBulkPrice } from "@/lib/admin/bulk-actions";
import { loadRefs } from "@/lib/admin/refs";

export const metadata: Metadata = { title: "Bulk price update" };

type SP = { platform?: string; category?: string; percent?: string; saved?: string; error?: string };

export default async function BulkPrice({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { db } = await requireAdmin();
  const refs = await loadRefs(db);
  const { data: cats } = await db.from("categories").select("id,platform_id");
  const percent = Number(sp.percent);
  const ready = Number.isFinite(percent) && percent !== 0 && Boolean(sp.percent);

  let services: { id: string; name: string; price_per_1000_usd: number; category_id: string }[] = [];
  if (ready) {
    let q = db.from("services").select("id,name,price_per_1000_usd,category_id").order("sort_order");
    if (sp.category) q = q.eq("category_id", sp.category);
    else if (sp.platform) q = q.in("category_id", (cats ?? []).filter((c) => c.platform_id === sp.platform).map((c) => c.id));
    services = (await q).data ?? [];
  }
  const next = (p: number) => Math.round(p * (1 + percent / 100) * 10000) / 10000;

  return (
    <div className="max-w-4xl">
      <AdminHeader title="Bulk price update" intro="Change prices for many services at once. You'll see a preview before anything is saved." />
      {sp.saved && <Notice>{sp.saved}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      <form className="grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4 sm:items-end">
        <label className="grid gap-1 text-sm font-semibold">Platform
          <Select name="platform" defaultValue={sp.platform ?? ""} className="h-11"><option value="">All platforms</option>{refs.platforms.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Category
          <Select name="category" defaultValue={sp.category ?? ""} className="h-11"><option value="">All categories</option>{refs.categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Change (%)
          <Input name="percent" type="number" step="0.1" min={-90} max={500} defaultValue={sp.percent ?? ""} placeholder="e.g. 10 or -5" className="h-11 font-mono" />
        </label>
        <Button type="submit" variant="secondary">Preview</Button>
      </form>

      {ready && (
        <form action={applyBulkPrice} className="mt-5">
          <input type="hidden" name="percent" value={percent} />
          <TableWrap>
            <table className="w-full">
              <thead className="border-b border-border bg-surface-2"><tr><th className={th}>Service</th><th className={`${th} text-right`}>Now</th><th className={`${th} text-right`}>After</th></tr></thead>
              <tbody className="divide-y divide-border">
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className={td}><input type="hidden" name="ids" value={s.id} />{s.name}</td>
                    <td className={`${td} text-right font-mono`}>${Number(s.price_per_1000_usd).toFixed(4)}</td>
                    <td className={`${td} text-right font-mono font-semibold`}>${next(Number(s.price_per_1000_usd)).toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <div className="mt-3 flex items-center gap-3">
            <Button type="submit" disabled={!services.length}>Apply {percent > 0 ? "+" : ""}{percent}% to {services.length} services</Button>
            <span className="text-sm text-fg-muted">Package prices are not changed automatically.</span>
          </div>
        </form>
      )}
    </div>
  );
}
