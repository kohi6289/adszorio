import { ArrowDown, ArrowUp, Copy, Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AdminHeader, Notice, TableWrap, td, th } from "@/components/admin/ui";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { requireAdmin } from "@/lib/admin/auth";
import { loadRefs } from "@/lib/admin/refs";
import { deleteRecord, duplicateRecord, moveRecord, toggleRecord } from "@/lib/admin/resource-actions";
import { resourceByKey, type ColumnDef } from "@/lib/admin/resources";
import { adminDate } from "@/lib/admin/tz";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ resource: string }>; searchParams: Promise<{ q?: string; saved?: string; error?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: resourceByKey((await params).resource)?.label ?? "Admin" };
}

export default async function ResourceList({ params, searchParams }: Props) {
  const [{ resource }, sp] = await Promise.all([params, searchParams]);
  const r = resourceByKey(resource);
  if (!r) notFound();
  const { db } = await requireAdmin();
  let query = db.from(r.table).select("*").order(r.orderBy, { ascending: r.ascending ?? true });
  if (sp.q) query = query.ilike(r.titleField, `%${sp.q.replace(/[%_]/g, "")}%`);
  const [{ data, error }, refs, fmt] = await Promise.all([query.limit(500), loadRefs(db), adminDate()]);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Record<string, unknown>[];
  const refLabel = (c: ColumnDef, v: unknown) => refs[c.ref!]?.find((o) => o.value === v)?.label ?? "—";

  const cell = (c: ColumnDef, row: Record<string, unknown>) => {
    const v = row[c.name];
    switch (c.kind) {
      case "bool": return v ? <span className="font-semibold text-success">Yes</span> : <span className="text-fg-subtle">No</span>;
      case "money4": return <span className="font-mono">${Number(v).toFixed(4)}</span>;
      case "money": return <span className="font-mono">${Number(v).toFixed(2)}</span>;
      case "badge": return <StatusBadge status={String(v)} />;
      case "ref": return refLabel(c, v);
      case "date": return <span className="md:whitespace-nowrap">{fmt(v as string)}</span>;
      case "color": return <span className="inline-flex items-center gap-2 font-mono"><span aria-hidden className="size-4 rounded-sm border border-border" style={{ background: String(v) }} />{String(v)}</span>;
      case "mono": return <span className="font-mono">{String(v ?? "")}</span>;
      default: return String(v ?? "—");
    }
  };

  return (
    <>
      <AdminHeader
        title={r.label}
        intro={r.intro}
        actions={r.canCreate && <Button asChild size="sm"><Link href={`/admin/${r.key}/new`}><Plus aria-hidden />New {r.singular}</Link></Button>}
      />
      {sp.saved && <Notice>{sp.saved === "deleted" ? "Deleted." : `Saved “${sp.saved}”.`}</Notice>}
      {sp.error && <Notice tone="error">{sp.error}</Notice>}

      <form className="mb-4 flex max-w-md gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search {r.label}</label>
        <Input id="q" name="q" defaultValue={sp.q} placeholder={`Search by ${r.titleField}`} className="h-11" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-strong p-8 text-center text-sm text-fg-muted">Nothing here yet.</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <TableWrap>
              <table className="w-full">
                <thead className="border-b border-border bg-surface-2">
                  <tr>
                    {r.columns.map((c) => <th key={c.name} scope="col" className={th}>{c.label}</th>)}
                    <th scope="col" className={cn(th, "text-right")}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row, i) => {
                    const id = String(row[r.pk]);
                    return (
                      <tr key={id} className="hover:bg-surface-2/50">
                        {r.columns.map((c, ci) => (
                          <td key={c.name} className={td}>
                            {ci === 0 ? <Link href={`/admin/${r.key}/${encodeURIComponent(id)}`} className="font-semibold text-fg hover:underline">{cell(c, row)}</Link> : cell(c, row)}
                          </td>
                        ))}
                        <td className={cn(td, "text-right")}><RowActions r={r} id={id} row={row} first={i === 0} last={i === rows.length - 1} searching={Boolean(sp.q)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          </div>

          {/* Mobile cards */}
          <ul className="grid gap-2 md:hidden">
            {rows.map((row, i) => {
              const id = String(row[r.pk]);
              return (
                <li key={id} className="rounded-lg border border-border bg-surface p-3">
                  <Link href={`/admin/${r.key}/${encodeURIComponent(id)}`} className="flex min-h-11 items-center font-semibold">{cell(r.columns[0], row)}</Link>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.8125rem]">
                    {r.columns.slice(1).map((c) => (
                      <div key={c.name} className="contents">
                        <dt className="text-fg-muted">{c.label}</dt><dd>{cell(c, row)}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-2 border-t border-border pt-2"><RowActions r={r} id={id} row={row} first={i === 0} last={i === rows.length - 1} searching={Boolean(sp.q)} /></div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

function RowActions({ r, id, row, first, last, searching }: {
  r: NonNullable<ReturnType<typeof resourceByKey>>; id: string; row: Record<string, unknown>; first: boolean; last: boolean; searching: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {r.toggles?.map((t) => (
        <form key={t} action={toggleRecord.bind(null, r.key, id, t)}>
          <Button type="submit" size="sm" variant="ghost" className="h-9 px-2.5 text-xs" aria-label={`${row[t] ? "Turn off" : "Turn on"} ${t.replace("is_", "")}`}>
            {row[t] ? (t === "is_featured" ? "Unfeature" : "Hide") : (t === "is_featured" ? "Feature" : "Show")}
          </Button>
        </form>
      ))}
      {r.sortable && !searching && (
        <>
          <form action={moveRecord.bind(null, r.key, id, "up")}><Button type="submit" size="icon" variant="ghost" className="size-9" disabled={first} aria-label="Move up"><ArrowUp aria-hidden /></Button></form>
          <form action={moveRecord.bind(null, r.key, id, "down")}><Button type="submit" size="icon" variant="ghost" className="size-9" disabled={last} aria-label="Move down"><ArrowDown aria-hidden /></Button></form>
        </>
      )}
      {r.canDuplicate && <form action={duplicateRecord.bind(null, r.key, id)}><Button type="submit" size="icon" variant="ghost" className="size-9" aria-label="Duplicate"><Copy aria-hidden /></Button></form>}
      <Button asChild size="icon" variant="ghost" className="size-9"><Link href={`/admin/${r.key}/${encodeURIComponent(id)}`} aria-label="Edit"><Pencil aria-hidden /></Link></Button>
      {r.canDelete && (
        <form action={deleteRecord.bind(null, r.key, id)}>
          <ConfirmButton size="sm" variant="ghost" className="h-9 px-2.5 text-xs text-danger" message={`Delete this ${r.singular}? This cannot be undone.`}>Delete</ConfirmButton>
        </form>
      )}
    </div>
  );
}
