import { RESOURCES } from "@/lib/admin/resources";

export const ADMIN_NAV: { group: string; items: { href: string; label: string }[] }[] = [
  { group: "Overview", items: [{ href: "/admin", label: "Dashboard" }, { href: "/admin/orders", label: "Orders" }, { href: "/admin/leads", label: "Leads" }] },
  {
    group: "Catalogue",
    items: [
      ...RESOURCES.filter((r) => r.group === "Catalogue").map((r) => ({ href: `/admin/${r.key}`, label: r.label })),
      { href: "/admin/bulk-price", label: "Bulk price update" },
    ],
  },
  { group: "Commerce", items: RESOURCES.filter((r) => r.group === "Commerce").map((r) => ({ href: `/admin/${r.key}`, label: r.label })) },
  { group: "Content", items: RESOURCES.filter((r) => r.group === "Content").map((r) => ({ href: `/admin/${r.key}`, label: r.label })) },
  {
    group: "System",
    items: [
      ...RESOURCES.filter((r) => r.group === "Privacy").map((r) => ({ href: `/admin/${r.key}`, label: r.label })),
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/audit", label: "Audit log" },
      { href: "/admin/account", label: "My account" },
    ],
  },
];
