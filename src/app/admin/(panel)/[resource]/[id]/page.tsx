import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ResourceForm } from "@/components/admin/resource-form";
import { AdminHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { loadRefs } from "@/lib/admin/refs";
import { resourceByKey } from "@/lib/admin/resources";

type Props = { params: Promise<{ resource: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resource, id } = await params;
  const r = resourceByKey(resource);
  return { title: r ? `${id === "new" ? "New" : "Edit"} ${r.singular}` : "Admin" };
}

const DEFAULTS: Record<string, Record<string, unknown>> = {
  platforms: { is_active: true, brand_color: "#14161A", icon: "other" },
  services: { is_active: true, quality_tier: "standard", link_type: "post", min_qty: 100, max_qty: 10000, start_time: "0–24 hours", start_time_hours_max: 24, speed: "1,000 per day", speed_per_day: 1000, refill_days: 30, requirements: [] },
  packages: { is_active: true, items: [] },
  currencies: { is_active: true, rounding_rule: "cents" },
  banners: { is_active: true, placement: "home_hero" },
  testimonials: { is_active: true, verified: false },
  faqs: { is_active: true, category: "General" },
  legal_pages: { published_at: null },
};

export default async function ResourceEdit({ params }: Props) {
  const { resource, id: rawId } = await params;
  const r = resourceByKey(resource);
  if (!r) notFound();
  const id = decodeURIComponent(rawId);
  const isNew = id === "new";
  if (isNew && !r.canCreate) notFound();
  const { db } = await requireAdmin();
  const [record, refs] = await Promise.all([
    isNew ? Promise.resolve(DEFAULTS[r.key] ?? {}) : db.from(r.table).select("*").eq(r.pk, id).maybeSingle().then(({ data }) => data as Record<string, unknown> | null),
    loadRefs(db),
  ]);
  if (!record) notFound();

  const title = isNew ? `New ${r.singular}` : String(record[r.titleField] ?? r.singular);
  const publicHref =
    !isNew && r.key === "services" ? null : // service URL needs platform; linked from list instead
    !isNew && r.key === "legal_pages" ? `/legal/${record.slug}` :
    !isNew && r.key === "packages" ? `/packages/${record.slug}` :
    !isNew && r.key === "platforms" ? `/${record.slug}` : null;

  return (
    <div className="max-w-4xl">
      <AdminHeader
        title={title}
        back={{ href: `/admin/${r.key}`, label: r.label }}
        actions={publicHref && <Link href={publicHref} target="_blank" className="inline-flex min-h-10 items-center text-sm font-semibold text-brand hover:underline">View on site ↗</Link>}
      />
      <ResourceForm resourceKey={r.key} id={isNew ? null : id} fields={r.fields} record={record} refs={refs} submitLabel={isNew ? `Create ${r.singular}` : "Save changes"} />
    </div>
  );
}
