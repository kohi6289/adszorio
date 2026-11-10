import type { Metadata } from "next";
import { AdminHeader, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const { user, role } = await requireAdmin();
  return (
    <>
      <AdminHeader title="My account" intro="Your dashboard login." />
      <div className="grid max-w-xl gap-4">
        <Panel title="Signed in as">
          <p className="font-medium break-all">{user.email}</p>
          <p className="mt-1 text-sm text-fg-muted capitalize">Role: {role}</p>
        </Panel>
        <Panel title="Change password"><PasswordForm /></Panel>
      </div>
    </>
  );
}
