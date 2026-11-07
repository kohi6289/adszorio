// Creates (or promotes) a dashboard admin.
// Usage: pnpm admin:create you@example.com 'a-strong-password' [owner|staff]
import { createClient } from "@supabase/supabase-js";

const [email, password, role = "owner"] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error("Usage: pnpm admin:create <email> <password (10+ chars)> [owner|staff]");
  process.exit(1);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (in .env.local).");

const db = createClient(url, key, { auth: { persistSession: false } });

let userId: string | undefined;
const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
if (created.error) {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id;
  if (!userId) throw created.error;
  await db.auth.admin.updateUserById(userId, { password });
} else {
  userId = created.data.user.id;
}
const { error } = await db.from("admin_users").upsert({ user_id: userId, role, display_name: email.split("@")[0] });
if (error) throw error;
console.log(`Admin ready: ${email} (${role})`);
