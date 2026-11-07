"use server";

import { z } from "zod";
import { fieldErrors, str, type ActionState } from "@/lib/actions-util";
import { rateLimit } from "@/lib/rate-limit";
import { DEMO_MESSAGE, hasSupabase } from "@/lib/supabase/env";
import { serviceClient } from "@/lib/supabase/service";
import type { OrderStatus, PaymentStatus, StatusEvent } from "@/types/models";

export interface TrackedOrder {
  order_code: string;
  item: string;
  quantity: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  start_count: number | null;
  delivered_count: number | null;
  created_at: string;
  history: StatusEvent[];
}

const Schema = z.object({
  code: z.string().regex(/^ADZ-\d{4,8}$/i, "Order codes look like ADZ-24817."),
  email: z.email("Please enter the email you ordered with."),
});

export async function trackOrder(_prev: ActionState<TrackedOrder>, fd: FormData): Promise<ActionState<TrackedOrder>> {
  if (!(await rateLimit("track", 15, 10 * 60_000))) return { status: "error", message: "Too many lookups. Please wait a few minutes." };
  const parsed = Schema.safeParse({ code: str(fd, "code").toUpperCase(), email: str(fd, "email").toLowerCase() });
  if (!parsed.success) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };

  if (!hasSupabase()) return { status: "error", message: DEMO_MESSAGE };

  const { data } = await serviceClient()
    .from("orders")
    .select("order_code,quantity,status,payment_status,start_count,delivered_count,created_at,status_history,services(name),packages(name)")
    .eq("order_code", parsed.data.code)
    .eq("email", parsed.data.email)
    .maybeSingle();
  // Same message whether the code or the email is wrong, so codes can't be probed.
  if (!data) return { status: "error", message: "We couldn't find an order with that code and email." };

  const svc = data.services as unknown as { name: string } | null;
  const pkg = data.packages as unknown as { name: string } | null;
  return {
    status: "success",
    data: {
      order_code: data.order_code,
      item: svc ? svc.name : `${pkg?.name ?? ""} package`,
      quantity: data.quantity,
      status: data.status,
      payment_status: data.payment_status,
      start_count: data.start_count,
      delivered_count: data.delivered_count,
      created_at: data.created_at,
      history: (data.status_history as StatusEvent[]) ?? [],
    },
  };
}
