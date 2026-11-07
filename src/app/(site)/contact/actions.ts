"use server";

import { z } from "zod";
import { fieldErrors, notifyOwner, str, type ActionState } from "@/lib/actions-util";
import { siteUrl } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_MESSAGE, hasSupabase } from "@/lib/supabase/env";
import { serviceClient } from "@/lib/supabase/service";

const Lead = z.object({
  name: z.string().min(2, "Please enter your name.").max(100),
  email: z.email("Please enter a valid email address."),
  phone: z.string().max(30).optional(),
  country: z.string().max(2).optional(),
  company: z.string().max(120).optional(),
  platform_interest: z.string().max(60).optional(),
  budget_range_usd: z.string().max(40).optional(),
  message: z.string().min(10, "Tell us a little more (at least 10 characters).").max(4000),
  source_page: z.string().max(200).optional(),
});

export async function submitLead(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (str(fd, "company_website")) return { status: "success", data: undefined };
  if (!(await rateLimit("lead", 5, 10 * 60_000))) return { status: "error", message: "Too many messages. Please wait a few minutes, or email us." };
  const opt = (k: string) => str(fd, k) || undefined;
  const parsed = Lead.safeParse({
    name: str(fd, "name"), email: str(fd, "email").toLowerCase(), phone: opt("phone"), country: opt("country"), company: opt("company"),
    platform_interest: opt("platform_interest"), budget_range_usd: opt("budget_range_usd"), message: str(fd, "message"), source_page: opt("source_page"),
  });
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  if (!hasSupabase()) return { status: "error", message: DEMO_MESSAGE };

  let utm: Record<string, string> = {};
  try { utm = JSON.parse(str(fd, "utm") || "{}"); } catch { /* ignore malformed */ }

  const { error } = await serviceClient().from("leads").insert({ ...parsed.data, utm });
  if (error) {
    console.error("[lead] insert failed", error);
    return { status: "error", message: "We couldn't send your message. Please email us instead." };
  }
  const l = parsed.data;
  await notifyOwner(
    `New lead: ${l.name}${l.company ? ` (${l.company})` : ""}${l.budget_range_usd ? ` · ${l.budget_range_usd}` : ""}`,
    `${l.name} <${l.email}> ${l.phone ?? ""}\nCountry: ${l.country ?? "—"}\nInterest: ${l.platform_interest ?? "—"}\nBudget: ${l.budget_range_usd ?? "—"}\n\n${l.message}\n\n${siteUrl("/admin/leads")}`,
  );
  return { status: "success", data: undefined };
}
