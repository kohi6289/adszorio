import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/ui";
import { getPrivateSettings } from "@/lib/actions-util";
import { requireAdmin } from "@/lib/admin/auth";
import { serviceClient } from "@/lib/supabase/service";
import type { SiteSettings } from "@/types/models";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { db } = await requireAdmin();
  const [{ data }, priv, { data: currencies }] = await Promise.all([
    serviceClient().from("site_settings").select("data").eq("id", 1).single(),
    getPrivateSettings(),
    db.from("currencies").select("code").eq("is_active", true).order("sort_order"),
  ]);
  return (
    <div className="max-w-4xl">
      <AdminHeader title="Settings" intro="Contact details, support hours, announcement, stats, SEO and notifications." />
      <SettingsForm s={data!.data as SiteSettings} priv={priv} currencies={(currencies ?? []).map((c) => c.code)} />
    </div>
  );
}
