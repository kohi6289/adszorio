"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LEAD_STATUSES } from "@/types/models";
import { audit, requireAdmin } from "./auth";

export async function updateLead(id: string, fd: FormData) {
  const { db, user } = await requireAdmin();
  const status = String(fd.get("status"));
  const notes = String(fd.get("notes") ?? "").slice(0, 5000) || null;
  if (!(LEAD_STATUSES as string[]).includes(status)) redirect(`/admin/leads/${id}?error=Invalid%20status`);
  await db.from("leads").update({ status, notes }).eq("id", id);
  await audit(db, user.id, "lead.update", "leads", id, { status });
  revalidatePath("/admin", "layout");
  redirect(`/admin/leads/${id}?saved=Saved`);
}

export async function setLeadStatus(id: string, status: string) {
  const { db, user } = await requireAdmin();
  if (!(LEAD_STATUSES as string[]).includes(status)) return;
  await db.from("leads").update({ status }).eq("id", id);
  await audit(db, user.id, "lead.status", "leads", id, { status });
  revalidatePath("/admin", "layout");
}
