"use server";

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fieldErrors, getPrivateSettings, notifyOwner, str, type ActionState } from "@/lib/actions-util";
import { COUNTRY_CODES } from "@/lib/countries";
import { CURRENCY_COOKIE } from "@/lib/currency";
import { getCatalog, getCurrencies, getSiteSettings } from "@/lib/data";
import { sendEmail, siteUrl } from "@/lib/email";
import { fmtInt, fmtUsd, LINK_LABEL } from "@/lib/format";
import { validateLink } from "@/lib/links";
import { ORDER_COOKIE } from "@/lib/order";
import { checkQuantity, packageTotalUsd, round2, serviceTotalUsd } from "@/lib/pricing";
import { rateLimit } from "@/lib/rate-limit";
import { RISK_LABEL, riskFlags } from "@/lib/risk";
import { DEMO_MESSAGE, hasSupabase } from "@/lib/supabase/env";
import { serviceClient } from "@/lib/supabase/service";
import type { LinkType } from "@/types/models";

const Contact = z.object({
  name: z.string().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address.").max(200),
  country: z.string().refine((c) => COUNTRY_CODES.has(c), "Please choose your country."),
  phone: z.string().max(30).optional(),
  timezone: z.string().max(60).optional(),
  terms: z.literal("on", { error: "Please accept the Terms of Service to continue." }),
});

/** Creates an order. All prices are computed here from the database; nothing from the client is trusted. */
export async function createOrder(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (str(fd, "company_website")) return { status: "error", message: "Something went wrong. Please try again." };
  if (!(await rateLimit("order", 6, 10 * 60_000))) {
    return { status: "error", message: "Too many orders from your connection. Please wait a few minutes or contact us." };
  }

  const contact = Contact.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email").toLowerCase(),
    country: str(fd, "country"),
    phone: str(fd, "phone") || undefined,
    timezone: str(fd, "timezone") || undefined,
    terms: fd.get("terms") ?? undefined,
  });
  if (!contact.success) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(contact.error) };
  const c = contact.data;

  let phone: string | null = null;
  if (c.phone) {
    const parsed = parsePhoneNumberFromString(c.phone, c.country as CountryCode);
    if (!parsed?.isValid()) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { phone: "That phone number doesn't look valid for the selected country." } };
    phone = parsed.number;
  }

  // ---- What is being bought, priced server-side ----
  const catalog = await getCatalog();
  const kind = str(fd, "kind");
  const slug = str(fd, "slug");
  let serviceId: string | null = null;
  let packageId: string | null = null;
  let quantity = 1;
  let amountUsd = 0;
  let itemName = "";
  let linkTypes: LinkType[] = [];

  if (kind === "service") {
    const s = catalog.services.find((x) => x.slug === slug);
    if (!s) return { status: "error", message: "That service is no longer available. Please choose another." };
    quantity = Number(str(fd, "qty"));
    const q = checkQuantity(s, quantity);
    if (!q.ok) return { status: "error", message: q.message, fieldErrors: { qty: q.message } };
    serviceId = s.id;
    amountUsd = serviceTotalUsd(s, quantity);
    itemName = `${fmtInt(quantity)} × ${s.name}`;
    linkTypes = [s.link_type];
  } else if (kind === "package") {
    const p = catalog.packages.find((x) => x.slug === slug);
    if (!p) return { status: "error", message: "That package is no longer available. Please choose another." };
    packageId = p.id;
    amountUsd = packageTotalUsd(p);
    itemName = `${p.name} package`;
    linkTypes = [...new Set(p.resolved.map((r) => r.service.link_type))];
  } else {
    return { status: "error", message: "Please choose a service or package." };
  }

  // ---- Links: one per distinct link type ----
  const links: string[] = [];
  for (const t of linkTypes) {
    const r = validateLink(t, str(fd, `link_${t}`));
    if (!r.ok) return { status: "error", message: "Please check your link.", fieldErrors: { [`link_${t}`]: r.message } };
    links.push(linkTypes.length > 1 ? `${LINK_LABEL[t]}: ${r.url}` : r.url);
  }

  // ---- Currency snapshot ----
  const currencies = await getCurrencies();
  const code = (await cookies()).get(CURRENCY_COOKIE)?.value;
  const currency = currencies.find((x) => x.code === code) ?? currencies.find((x) => x.code === "USD")!;
  const amount = round2(amountUsd * currency.rate_to_usd);

  if (!hasSupabase()) return { status: "error", message: DEMO_MESSAGE };

  // ---- Risk ----
  const db = serviceClient();
  const ipCountry = (await headers()).get("x-vercel-ip-country");
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const [{ count: previous }, { count: today }, priv] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).eq("email", c.email).neq("status", "cancelled"),
    db.from("orders").select("id", { count: "exact", head: true }).eq("email", c.email).gte("created_at", startOfDay.toISOString()),
    getPrivateSettings(),
  ]);
  const flags = riskFlags({
    email: c.email, country: c.country, ipCountry, amountUsd,
    previousOrders: previous ?? 0, ordersToday: today ?? 0, firstOrderMaxUsd: priv.first_order_max_usd,
  });

  const now = new Date().toISOString();
  const { data: order, error } = await db
    .from("orders")
    .insert({
      customer_name: c.name, email: c.email, phone, country: c.country, customer_timezone: c.timezone ?? null, ip_country: ipCountry,
      service_id: serviceId, package_id: packageId, quantity, target_link: links.join("\n"),
      currency: currency.code, fx_rate: currency.rate_to_usd, amount, amount_usd: amountUsd,
      risk_flags: flags, requires_review: flags.length > 0,
      status_history: [{ status: "pending", at: now, note: "Order placed" }],
    })
    .select("order_code")
    .single();
  if (error || !order) {
    console.error("[order] insert failed", error);
    return { status: "error", message: "We couldn't save your order. Please try again, or contact us." };
  }

  // ---- Emails (failures are logged, never block the order) ----
  const settings = await getSiteSettings();
  const shown = currency.code === "USD" ? fmtUsd(amountUsd) : `${fmtUsd(amountUsd)} (≈ ${amount.toFixed(2)} ${currency.code})`;
  await Promise.all([
    sendEmail({
      to: c.email,
      replyTo: settings.contact.email,
      subject: `Order ${order.order_code} received — payment details to follow`,
      text: `Hi ${c.name},\n\nThanks for your order with ${settings.brand}.\n\nOrder: ${order.order_code}\nItem: ${itemName}\nLink: ${links.join(", ")}\nTotal: ${shown}\n\nWe'll email you payment details shortly. Your order starts once payment is confirmed.\nTrack it any time: ${siteUrl(`/track?code=${order.order_code}`)}\n\nWe will never ask for your password.\n\n— ${settings.brand}`,
    }),
    notifyOwner(
      `${flags.length ? "[REVIEW] " : ""}New order ${order.order_code}: ${itemName} — ${fmtUsd(amountUsd)}`,
      `Customer: ${c.name} <${c.email}> ${phone ?? ""}\nCountry: ${c.country} (IP: ${ipCountry ?? "unknown"})\nItem: ${itemName}\nLinks:\n${links.join("\n")}\nTotal: ${shown}\nRisk: ${flags.map((f) => RISK_LABEL[f]).join(", ") || "none"}\n\n${siteUrl("/admin/orders")}`,
    ),
  ]);

  (await cookies()).set(ORDER_COOKIE, order.order_code, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24, secure: process.env.NODE_ENV === "production" });
  redirect(`/order/confirmed?code=${order.order_code}`);
}
