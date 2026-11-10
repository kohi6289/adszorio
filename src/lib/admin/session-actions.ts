"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions-util";
import { rateLimit } from "@/lib/rate-limit";
import { hasSupabase } from "@/lib/supabase/env";
import { sessionClient } from "@/lib/supabase/server";
import { audit, requireAdmin } from "./auth";
import { ADMIN_TZ_COOKIE } from "./tz";

export async function signIn(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!(await rateLimit("admin-login", 8, 15 * 60_000))) return { status: "error", message: "Too many attempts. Try again in 15 minutes." };
  if (!hasSupabase()) return { status: "error", message: "The dashboard isn't connected to a database yet." };
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const db = await sessionClient();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { status: "error", message: "Email or password is incorrect." };
  const { data: admin } = await db.from("admin_users").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!admin) {
    await db.auth.signOut();
    return { status: "error", message: "This account does not have admin access." };
  }
  redirect("/admin");
}

export async function signOut() {
  const db = await sessionClient();
  await db.auth.signOut();
  redirect("/admin/login");
}

export async function toggleAdminTz() {
  const store = await cookies();
  const next = store.get(ADMIN_TZ_COOKIE)?.value === "UTC" ? "Asia/Kolkata" : "UTC";
  store.set(ADMIN_TZ_COOKIE, next, { path: "/admin", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

/** Signed-in admin changes their own password (current password re-checked first). */
export async function changePassword(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!(await rateLimit("admin-password", 5, 15 * 60_000))) return { status: "error", message: "Too many attempts. Try again in 15 minutes." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (next.length < 12) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { next: "Use at least 12 characters." } };
  if (next !== confirm) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { confirm: "The two new passwords don't match." } };
  if (next === current) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { next: "Choose a password different from the current one." } };

  const { db, user } = await requireAdmin();
  const check = await db.auth.signInWithPassword({ email: user.email!, password: current });
  if (check.error) return { status: "error", message: "Please check the highlighted fields.", fieldErrors: { current: "Current password is incorrect." } };
  const { error } = await db.auth.updateUser({ password: next });
  if (error) return { status: "error", message: error.message };
  await audit(db, user.id, "password_change", "admin_user", user.id);
  return { status: "success", data: undefined };
}
