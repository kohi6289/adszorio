import "server-only";
import type { RefOption } from "@/components/admin/resource-form";
import type { requireAdmin } from "./auth";

type Db = Awaited<ReturnType<typeof requireAdmin>>["db"];

/** Options for reference fields, labelled with their platform so similar names are distinguishable. */
export async function loadRefs(db: Db): Promise<Record<string, RefOption[]>> {
  const [{ data: platforms }, { data: categories }, { data: services }] = await Promise.all([
    db.from("platforms").select("id,name").order("sort_order"),
    db.from("categories").select("id,name,platform_id").order("sort_order"),
    db.from("services").select("id,name,category_id,is_active").order("sort_order"),
  ]);
  const pName = new Map((platforms ?? []).map((p) => [p.id, p.name]));
  const cats = categories ?? [];
  const cPlat = new Map(cats.map((c) => [c.id, pName.get(c.platform_id) ?? ""]));
  return {
    platforms: (platforms ?? []).map((p) => ({ value: p.id, label: p.name })),
    categories: cats.map((c) => ({ value: c.id, label: `${pName.get(c.platform_id) ?? ""} · ${c.name}` })),
    services: (services ?? []).map((s) => ({ value: s.id, label: `${s.name}${s.is_active ? "" : " (hidden)"}`, meta: cPlat.get(s.category_id) })),
  };
}
