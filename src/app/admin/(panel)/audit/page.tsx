import type { Metadata } from "next";
import { AdminHeader, TableWrap, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { adminDate } from "@/lib/admin/tz";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditPage() {
  const { db } = await requireAdmin();
  const [{ data }, { data: admins }, fmt] = await Promise.all([
    db.from("audit_log").select("*").order("created_at", { ascending: false }).limit(300),
    db.from("admin_users").select("user_id,display_name"),
    adminDate(),
  ]);
  const who = new Map((admins ?? []).map((a) => [a.user_id, a.display_name]));
  return (
    <>
      <AdminHeader title="Audit log" intro="Every change made in the dashboard (latest 300). Entries cannot be edited or deleted." />
      <TableWrap>
        <table className="w-full">
          <thead className="border-b border-border bg-surface-2"><tr><th className={th}>When</th><th className={th}>Who</th><th className={th}>Action</th><th className={th}>Record</th><th className={th}>Details</th></tr></thead>
          <tbody className="divide-y divide-border">
            {(data ?? []).map((a) => (
              <tr key={a.id} className="align-top">
                <td className={`${td} whitespace-nowrap`}>{fmt(a.created_at)}</td>
                <td className={td}>{who.get(a.actor_id) ?? "—"}</td>
                <td className={`${td} font-mono`}>{a.action}</td>
                <td className={`${td} font-mono text-xs`}>{a.entity}{a.entity_id ? ` · ${String(a.entity_id).slice(0, 8)}` : ""}</td>
                <td className={td}><code className="line-clamp-3 max-w-md text-xs break-all text-fg-muted">{a.diff ? JSON.stringify(a.diff) : ""}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
