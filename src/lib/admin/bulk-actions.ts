"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "./auth";

export async function applyBulkPrice(fd: FormData) {
  const { db, user } = await requireAdmin();
  const percent = Number(fd.get("percent"));
  const ids = fd.getAll("ids").map(String);
  if (!Number.isFinite(percent) || percent < -90 || percent > 500 || percent === 0 || !ids.length) {
    redirect(`/admin/bulk-price?error=${encodeURIComponent("Nothing to apply.")}`);
  }
  const { data } = await db.from("services").select("id,price_per_1000_usd").in("id", ids);
  const changes = (data ?? []).map((s) => ({ id: s.id, from: Number(s.price_per_1000_usd), to: Math.round(Number(s.price_per_1000_usd) * (1 + percent / 100) * 10000) / 10000 }));
  for (const c of changes) await db.from("services").update({ price_per_1000_usd: c.to }).eq("id", c.id);
  await audit(db, user.id, "services.bulk_price", "services", null, { percent, changes });
  revalidatePath("/", "layout");
  redirect(`/admin/bulk-price?saved=${encodeURIComponent(`Updated ${changes.length} service prices by ${percent > 0 ? "+" : ""}${percent}%`)}`);
}
