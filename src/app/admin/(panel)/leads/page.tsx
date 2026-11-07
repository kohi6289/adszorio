import { Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { requireAdmin } from "@/lib/admin/auth";
import { setLeadStatus } from "@/lib/admin/lead-actions";
import { adminDate } from "@/lib/admin/tz";
import { label } from "@/lib/format";
import { LEAD_STATUSES } from "@/types/models";

export const metadata: Metadata = { title: "Leads" };

/** Mini CRM: a pipeline board (columns by status) that stacks on phones. */
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { db } = await requireAdmin();
  let query = db.from("leads").select("id,name,email,company,country,budget_range_usd,platform_interest,status,created_at,message").order("created_at", { ascending: false }).limit(500);
  const term = q?.replace(/[%_,()]/g, "").trim();
  if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,company.ilike.%${term}%`);
  const [{ data }, fmt] = await Promise.all([query, adminDate()]);
  const leads = data ?? [];

  return (
    <>
      <AdminHeader title="Leads" intro="Custom quote and contact requests." actions={<Button asChild size="sm" variant="secondary"><a href="/admin/leads/export" download><Download aria-hidden />Export CSV</a></Button>} />
      <form className="mb-4 flex max-w-md gap-2" role="search">
        <label htmlFor="lq" className="sr-only">Search leads</label>
        <Input id="lq" name="q" defaultValue={q} placeholder="Name, email or company" className="h-11" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {LEAD_STATUSES.map((s) => {
          const col = leads.filter((l) => l.status === s);
          return (
            <section key={s} aria-labelledby={`col-${s}`} className="rounded-lg border border-border bg-surface-2/60 p-2">
              <h2 id={`col-${s}`} className="flex items-center justify-between px-2 py-1.5 text-sm font-semibold">{label(s)} <span className="font-mono text-fg-muted">{col.length}</span></h2>
              <ul className="grid gap-2">
                {col.map((l) => (
                  <li key={l.id} className="rounded-md border border-border bg-surface p-3 text-[0.8125rem]">
                    <Link href={`/admin/leads/${l.id}`} className="flex min-h-11 items-center font-semibold hover:underline">{l.name}{l.company ? ` · ${l.company}` : ""}</Link>
                    <p className="text-fg-muted">{l.email}</p>
                    <p className="mt-1 line-clamp-2 text-fg-muted">{l.message}</p>
                    <p className="mt-1 text-xs text-fg-subtle">{[l.platform_interest, l.budget_range_usd, l.country].filter(Boolean).join(" · ")} · {fmt(l.created_at)}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {LEAD_STATUSES.filter((x) => x !== s).map((x) => (
                        <form key={x} action={setLeadStatus.bind(null, l.id, x)}>
                          <button type="submit" className="min-h-8 cursor-pointer rounded-full border border-border px-2.5 text-xs font-medium text-fg-muted hover:text-fg">→ {label(x)}</button>
                        </form>
                      ))}
                    </div>
                  </li>
                ))}
                {col.length === 0 && <li className="px-2 py-3 text-xs text-fg-subtle">None</li>}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-fg-subtle"><StatusBadge status="new" /> leads trigger an email to your notification addresses.</p>
    </>
  );
}
