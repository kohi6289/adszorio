import "server-only";
import { z } from "zod";
import { sendEmail } from "./email";
import { serviceClient } from "./supabase/service";

export type ActionState<T = undefined> =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> }
  | { status: "success"; data: T };

export const idle = { status: "idle" } as const;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? "Invalid value"]));
}

export const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export interface PrivateSettings {
  notification_emails: string[];
  first_order_max_usd: number;
}

export async function getPrivateSettings(): Promise<PrivateSettings> {
  const { data } = await serviceClient().from("site_settings").select("private").eq("id", 1).single();
  const p = (data?.private ?? {}) as Partial<PrivateSettings>;
  return { notification_emails: p.notification_emails ?? [], first_order_max_usd: p.first_order_max_usd ?? 250 };
}

export async function notifyOwner(subject: string, text: string) {
  const { notification_emails } = await getPrivateSettings();
  if (notification_emails.length) await sendEmail({ to: notification_emails, subject, text });
}
