"use server";

import { z } from "zod";
import { fieldErrors, notifyOwner, str, type ActionState } from "@/lib/actions-util";
import { siteUrl } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_MESSAGE, hasSupabase } from "@/lib/supabase/env";
import { serviceClient } from "@/lib/supabase/service";

const Schema = z.object({
  type: z.enum(["export", "delete"], { error: "Choose what you'd like us to do." }),
  email: z.email("Please enter the email you used with us."),
  details: z.string().max(2000).optional(),
});

export async function submitDataRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (str(fd, "company_website")) return { status: "success", data: undefined };
  if (!(await rateLimit("dsr", 3, 60 * 60_000))) return { status: "error", message: "Too many requests. Please email us instead." };
  const parsed = Schema.safeParse({ type: str(fd, "type"), email: str(fd, "email").toLowerCase(), details: str(fd, "details") || undefined });
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  if (!hasSupabase()) return { status: "error", message: DEMO_MESSAGE };
  const { error } = await serviceClient().from("data_requests").insert(parsed.data);
  if (error) return { status: "error", message: "We couldn't save your request. Please email us instead." };
  await notifyOwner(`Privacy request (${parsed.data.type}) from ${parsed.data.email}`, `Respond within 30 days (GDPR) / 45 days (CCPA).\n\n${siteUrl("/admin/data_requests")}`);
  return { status: "success", data: undefined };
}
