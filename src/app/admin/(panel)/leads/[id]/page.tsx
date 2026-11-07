import { Mail, MessageCircle, Send } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminHeader, Notice, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/form";
import { requireAdmin } from "@/lib/admin/auth";
import { updateLead } from "@/lib/admin/lead-actions";
import { adminDate } from "@/lib/admin/tz";
import { countryName } from "@/lib/countries";
import { label } from "@/lib/format";
import { LEAD_STATUSES } from "@/types/models";

export const metadata: Metadata = { title: "Lead" };

export default async function LeadDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { db } = await requireAdmin();
  const [{ data: l }, fmt] = await Promise.all([db.from("leads").select("*").eq("id", id).maybeSingle(), adminDate()]);
  if (!l) notFound();
  const wa = String(l.phone ?? "").replace(/[^\d]/g, "");
  return (
    <div className="max-w-4xl">
      <AdminHeader title={l.name} back={{ href: "/admin/leads", label: "Leads" }} />
      {sp.saved && <Notice>{sp.saved}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="grid min-w-0 content-start gap-4 md:col-span-2">
          <Panel title="Message"><p className="text-sm whitespace-pre-line">{l.message}</p></Panel>
          <Panel title="Pipeline">
            <form action={updateLead.bind(null, l.id)} className="grid gap-3">
              <Select aria-label="Status" name="status" defaultValue={l.status} className="h-11 max-w-xs">{LEAD_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</Select>
              <label className="grid gap-1 text-sm font-semibold">Notes<Textarea name="notes" rows={5} defaultValue={l.notes ?? ""} /></label>
              <Button type="submit" size="sm" className="justify-self-start">Save</Button>
            </form>
          </Panel>
        </div>
        <Panel title="Contact">
          <dl className="grid gap-1 text-sm">
            <dt className="text-fg-muted">Email</dt><dd className="break-all">{l.email}</dd>
            {l.phone && <><dt className="text-fg-muted">Phone</dt><dd className="font-mono">{l.phone}</dd></>}
            {l.company && <><dt className="text-fg-muted">Company</dt><dd>{l.company}</dd></>}
            <dt className="text-fg-muted">Country</dt><dd>{countryName(l.country) || "—"}</dd>
            <dt className="text-fg-muted">Interest / budget</dt><dd>{[l.platform_interest, l.budget_range_usd].filter(Boolean).join(" · ") || "—"}</dd>
            <dt className="text-fg-muted">Received</dt><dd>{fmt(l.created_at)}</dd>
            {Object.keys(l.utm ?? {}).length > 0 && <><dt className="text-fg-muted">UTM</dt><dd className="font-mono text-xs break-all">{JSON.stringify(l.utm)}</dd></>}
          </dl>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="secondary"><a href={`mailto:${l.email}`}><Mail aria-hidden />Email</a></Button>
            {wa && <Button asChild size="sm" variant="secondary"><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden />WhatsApp</a></Button>}
            {wa && <Button asChild size="sm" variant="secondary"><a href={`https://t.me/+${wa}`} target="_blank" rel="noopener noreferrer"><Send aria-hidden />Telegram</a></Button>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
