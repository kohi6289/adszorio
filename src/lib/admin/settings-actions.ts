"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/actions-util";
import { serviceClient } from "@/lib/supabase/service";
import type { SiteSettings } from "@/types/models";
import { audit, requireAdmin } from "./auth";

/** Settings live in one row: `data` is public, `private` is admin-only (only the service role can read it). */
export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const { db, user } = await requireAdmin();
  const s = (k: string) => String(fd.get(k) ?? "").trim();
  const errors: Record<string, string> = {};

  const email = s("contact_email");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.contact_email = "Enter a valid email.";
  const whatsapp = s("whatsapp").replace(/[^\d+]/g, "");
  if (whatsapp && !/^\+[1-9]\d{6,14}$/.test(whatsapp)) errors.whatsapp = "Use international format, e.g. +919800000000.";
  const timezone = s("support_tz");
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch { errors.support_tz = "Unknown time zone (e.g. Asia/Kolkata)."; }

  const stats = s("stats").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0]);
  const parsedStats = stats.map(([lbl, value, suffix]) => ({ label: lbl, value: Number(String(value).replace(/,/g, "")), ...(suffix ? { suffix } : {}) }));
  if (parsedStats.some((x) => !Number.isFinite(x.value))) errors.stats = "Each line: Label | number | optional suffix";
  const socials = s("socials").split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p[0] && p[1]).map(([lbl, url]) => ({ label: lbl, url }));
  const notification = s("notification_emails").split(",").map((x) => x.trim()).filter(Boolean);
  if (notification.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) errors.notification_emails = "Comma-separated valid emails.";
  const firstMax = Number(s("first_order_max_usd"));
  if (!Number.isFinite(firstMax) || firstMax < 0) errors.first_order_max_usd = "Enter an amount in USD.";
  const { data: currencies } = await db.from("currencies").select("code");
  if (!(currencies ?? []).some((c) => c.code === s("default_currency"))) errors.default_currency = "Choose an active currency.";

  if (Object.keys(errors).length) return { status: "error", message: "Please fix the highlighted fields.", fieldErrors: errors };

  const data: SiteSettings = {
    brand: s("brand") || "Adszorio",
    domain: s("domain") || "adszorio.com",
    contact: { email, whatsapp, telegram: s("telegram").replace(/^@/, "") },
    socials,
    support_hours: { timezone, days: s("support_days"), open: s("support_open"), close: s("support_close") },
    stats: parsedStats,
    announcement: s("announcement") ? { text: s("announcement"), ...(s("announcement_link") ? { link: s("announcement_link") } : {}) } : null,
    default_currency: s("default_currency"),
    seo: { title: s("seo_title"), description: s("seo_description") },
  };
  const priv = { notification_emails: notification, first_order_max_usd: firstMax };
  const { error } = await serviceClient().from("site_settings").update({ data, private: priv }).eq("id", 1);
  if (error) return { status: "error", message: error.message };
  await audit(db, user.id, "settings.update", "site_settings", "1", { data, private: priv });
  revalidatePath("/", "layout");
  return { status: "success", data: undefined };
}
