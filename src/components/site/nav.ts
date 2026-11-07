import type { Platform } from "@/types/models";

export interface NavItem {
  href: string;
  label: string;
  platform?: string;
}

/** Primary navigation. Platform links are generated from the DB so new platforms appear automatically. */
export function primaryNav(platforms: Platform[]): NavItem[] {
  return [
    { href: "/services", label: "Services" },
    ...platforms.map((p) => ({ href: `/${p.slug}`, label: p.name, platform: p.slug })),
    { href: "/packages", label: "Packages" },
    { href: "/track", label: "Track order" },
  ];
}
