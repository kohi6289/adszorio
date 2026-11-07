import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { signOut, toggleAdminTz } from "@/lib/admin/session-actions";
import { adminTz } from "@/lib/admin/tz";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [{ name }, tz] = await Promise.all([requireAdmin(), adminTz()]);
  return <AdminShell name={name} tz={tz} signOut={signOut} toggleTz={toggleAdminTz}>{children}</AdminShell>;
}
