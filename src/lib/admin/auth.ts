import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { hasSupabase } from "@/lib/supabase/env";
import { sessionClient } from "@/lib/supabase/server";

/** Gate for every admin page and action: signed in AND listed in admin_users. */
export const requireAdmin = cache(async () => {
  if (!hasSupabase()) redirect("/admin/login?error=not-connected");
  const db = await sessionClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await db.from("admin_users").select("role, display_name").eq("user_id", user.id).maybeSingle();
  if (!admin) redirect("/admin/login?error=not-admin");
  return { db, user, role: admin.role as "owner" | "staff", name: admin.display_name ?? user.email ?? "Admin" };
});

type Db = Awaited<ReturnType<typeof sessionClient>>;

/** Append-only audit trail of admin changes. */
export async function audit(db: Db, actorId: string, action: string, entity: string, entityId: string | null, diff?: unknown) {
  const { error } = await db.from("audit_log").insert({ actor_id: actorId, action, entity, entity_id: entityId, diff: diff ?? null });
  if (error) console.error("[audit] failed", error.message);
}
