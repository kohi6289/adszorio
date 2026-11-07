"use client";

import { useState } from "react";
import type { PackageView, Platform, ServiceView } from "@/types/models";
import { PackageCard } from "./package-card";
import { ServiceCard } from "./service-card";

/** Home "Popular" section with platform tabs that re-theme the accent colour. */
export function PlatformShowcase({ platforms: all, services, packages }: { platforms: Platform[]; services: ServiceView[]; packages: PackageView[] }) {
  // Hide tabs that would be empty (a new platform without packages or featured services yet).
  const platforms = all.filter((p) => packages.some((x) => x.platform_slug === p.slug) || services.some((s) => s.platform_slug === p.slug && s.is_featured));
  const [active, setActive] = useState(platforms[0]?.slug ?? "");
  const pkgs = packages.filter((p) => p.platform_slug === active);
  const svcs = services.filter((s) => s.platform_slug === active && s.is_featured);
  return (
    <div data-platform={active}>
      <div role="tablist" aria-label="Choose a platform" className="flex gap-2 overflow-x-auto pb-1">
        {platforms.map((p) => (
          <button
            key={p.id}
            role="tab"
            id={`tab-${p.slug}`}
            aria-controls="showcase-panel"
            aria-selected={active === p.slug}
            onClick={() => setActive(p.slug)}
            className="relative min-h-11 shrink-0 cursor-pointer rounded-full border border-border bg-surface px-5 text-sm font-semibold text-fg-muted transition-colors hover:text-fg aria-selected:border-transparent aria-selected:bg-fg aria-selected:text-bg"
          >
            {p.name}
          </button>
        ))}
      </div>
      <div id="showcase-panel" role="tabpanel" aria-labelledby={`tab-${active}`} className="mt-8">
        {pkgs.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {pkgs.map((p, i) => <PackageCard key={p.id} p={p} highlight={i === 1} />)}
          </div>
        )}
        {svcs.length > 0 && (
          <>
            <h3 className="mt-12 font-display text-xl font-semibold">Popular single services</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {svcs.map((s) => <ServiceCard key={s.id} s={s} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
