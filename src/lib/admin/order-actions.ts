"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSiteSettings } from "@/lib/data";
import { sendEmail, siteUrl } from "@/lib/email";
import { label } from "@/lib/format";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type StatusEvent } from "@/types/models";
import { audit, requireAdmin } from "./auth";

const back = (id: string, msg: string) => redirect(`/admin/orders/${id}?saved=${encodeURIComponent(msg)}`);

async function emailCustomer(order: { email: string; customer_name: string; order_code: string }, status: OrderStatus, note: string) {
  const s = await getSiteSettings();
  await sendEmail({
    to: order.email,
    replyTo: s.contact.email,
    subject: `Order ${order.order_code}: ${label(status)}`,
    text: `Hi ${order.customer_name},\n\nYour order ${order.order_code} is now: ${label(status)}.${note ? `\n\n${note}` : ""}\n\nTrack it: ${siteUrl(`/track?code=${order.order_code}`)}\n\n— ${s.brand}`,
  });
}

export async function setOrderStatus(id: string, fd: FormData) {
  const { db, user } = await requireAdmin();
  const status = String(fd.get("status")) as OrderStatus;
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  const notify = fd.get("notify") === "on";
  if (!ORDER_STATUSES.includes(status)) back(id, "Invalid status");

  const { data: o } = await db.from("orders").select("status,status_history,requires_review,email,customer_name,order_code").eq("id", id).single();
  if (!o) back(id, "Order not found");
  // Flagged orders must be approved before they can move forward.
  if (o!.requires_review && !["pending", "cancelled", "refunded"].includes(status)) {
    redirect(`/admin/orders/${id}?error=${encodeURIComponent("This order is flagged. Approve it first, or cancel it.")}`);
  }
  const history = [...((o!.status_history as StatusEvent[]) ?? []), { status, at: new Date().toISOString(), ...(note ? { note } : {}) }];
  await db.from("orders").update({ status, status_history: history }).eq("id", id);
  await audit(db, user.id, "order.status", "orders", id, { from: o!.status, to: status, note });
  if (notify) await emailCustomer(o!, status, note);
  revalidatePath("/admin", "layout");
  back(id, `Status set to ${label(status)}${notify ? " · customer emailed" : ""}`);
}

export async function setPayment(id: string, fd: FormData) {
  const { db, user } = await requireAdmin();
  const payment_status = String(fd.get("payment_status"));
  const payment_method = String(fd.get("payment_method") ?? "").trim().slice(0, 80) || null;
  const payment_ref = String(fd.get("payment_ref") ?? "").trim().slice(0, 200) || null;
  if (!(PAYMENT_STATUSES as string[]).includes(payment_status)) back(id, "Invalid payment status");
  await db.from("orders").update({ payment_status, payment_method, payment_ref }).eq("id", id);
  await audit(db, user.id, "order.payment", "orders", id, { payment_status, payment_method, payment_ref });
  revalidatePath("/admin", "layout");
  back(id, "Payment updated");
}

export async function setFulfilment(id: string, fd: FormData) {
  const { db, user } = await requireAdmin();
  const n = (k: string) => { const v = String(fd.get(k) ?? "").trim(); return v === "" ? null : Math.max(0, Math.floor(Number(v))); };
  const update: Record<string, unknown> = { start_count: n("start_count"), delivered_count: n("delivered_count"), admin_notes: String(fd.get("admin_notes") ?? "").slice(0, 5000) || null };

  const files = fd.getAll("proof").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length) {
    const { data: o } = await db.from("orders").select("delivery_proof_urls,order_code").eq("id", id).single();
    const paths = [...((o?.delivery_proof_urls as string[]) ?? [])];
    for (const file of files.slice(0, 6)) {
      if (file.size > 5 * 1024 * 1024 || !/^(image\/(png|jpeg|webp)|application\/pdf)$/.test(file.type)) {
        redirect(`/admin/orders/${id}?error=${encodeURIComponent("Proof files must be PNG, JPG, WebP or PDF, up to 5 MB.")}`);
      }
      const path = `${o?.order_code}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"}`;
      const { error } = await db.storage.from("order-proofs").upload(path, file, { contentType: file.type });
      if (error) redirect(`/admin/orders/${id}?error=${encodeURIComponent(`Upload failed: ${error.message}`)}`);
      paths.push(path);
    }
    update.delivery_proof_urls = paths;
  }
  await db.from("orders").update(update).eq("id", id);
  await audit(db, user.id, "order.fulfilment", "orders", id, { ...update, proofs_added: files.length });
  revalidatePath("/admin", "layout");
  back(id, "Fulfilment details saved");
}

export async function approveOrder(id: string) {
  const { db, user } = await requireAdmin();
  await db.from("orders").update({ requires_review: false }).eq("id", id);
  await audit(db, user.id, "order.approve", "orders", id);
  revalidatePath("/admin", "layout");
  back(id, "Order approved");
}

export async function bulkSetStatus(fd: FormData) {
  const { db, user } = await requireAdmin();
  const ids = fd.getAll("ids").map(String).slice(0, 200);
  const status = String(fd.get("bulk_status")) as OrderStatus;
  const qs = String(fd.get("return") ?? "");
  if (!ids.length || !ORDER_STATUSES.includes(status)) redirect(`/admin/orders?${qs}&error=${encodeURIComponent("Select orders and a status.")}`);
  const { data } = await db.from("orders").select("id,status,status_history,requires_review").in("id", ids);
  let skipped = 0;
  const at = new Date().toISOString();
  for (const o of data ?? []) {
    if (o.requires_review && !["pending", "cancelled", "refunded"].includes(status)) { skipped++; continue; }
    await db.from("orders").update({ status, status_history: [...(o.status_history as StatusEvent[]), { status, at, note: "Bulk update" }] }).eq("id", o.id);
  }
  await audit(db, user.id, "order.bulk_status", "orders", null, { ids, status, skipped });
  revalidatePath("/admin", "layout");
  redirect(`/admin/orders?${qs}&saved=${encodeURIComponent(`Updated ${ids.length - skipped} order(s)${skipped ? `, skipped ${skipped} flagged` : ""}`)}`);
}
