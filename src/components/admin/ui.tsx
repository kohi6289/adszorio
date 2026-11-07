import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminHeader({ title, intro, actions, back }: { title: string; intro?: string; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && <Link href={back.href} className="inline-flex min-h-9 items-center text-sm text-fg-muted hover:text-fg">← {back.label}</Link>}
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        {intro && <p className="mt-1 max-w-[80ch] text-sm text-fg-muted">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: React.ReactNode; className?: string; actions?: React.ReactNode }) {
  return (
    <section className={cn("rounded-lg border border-border bg-surface", className)}>
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Notice({ tone = "success", children }: { tone?: "success" | "error"; children: React.ReactNode }) {
  return (
    <p role="status" className={cn("mb-4 rounded-md border px-3 py-2 text-sm font-medium", tone === "success" ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger")}>
      {children}
    </p>
  );
}

/** Dense admin table wrapper: scrolls horizontally inside itself, never the page. */
export function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto rounded-lg border border-border bg-surface">{children}</div>;
}

export const th = "px-3 py-2.5 text-left text-xs font-semibold text-fg-muted uppercase whitespace-nowrap";
export const td = "px-3 py-2 align-middle text-[0.8125rem]";
