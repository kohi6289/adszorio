import "server-only";
import { cookies } from "next/headers";
import { fmtDateTime } from "@/lib/format";

export const ADMIN_TZ_COOKIE = "adz_admin_tz";
export type AdminTz = "Asia/Kolkata" | "UTC";

export async function adminTz(): Promise<AdminTz> {
  return (await cookies()).get(ADMIN_TZ_COOKIE)?.value === "UTC" ? "UTC" : "Asia/Kolkata";
}

export async function adminDate() {
  const tz = await adminTz();
  return (iso: string | null | undefined) => (iso ? fmtDateTime(iso, tz) : "—");
}
