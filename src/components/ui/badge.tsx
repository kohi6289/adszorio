import { cn } from "@/lib/utils";
import { label } from "@/lib/format";

const TONE: Record<string, string> = {
  pending: "bg-warning/12 text-warning",
  unpaid: "bg-warning/12 text-warning",
  partial: "bg-warning/12 text-warning",
  new: "bg-info/12 text-info",
  received: "bg-info/12 text-info",
  confirmed: "bg-info/12 text-info",
  processing: "bg-info/12 text-info",
  in_progress: "bg-info/12 text-info",
  contacted: "bg-info/12 text-info",
  completed: "bg-success/12 text-success",
  paid: "bg-success/12 text-success",
  converted: "bg-success/12 text-success",
  cancelled: "bg-surface-2 text-fg-muted",
  lost: "bg-surface-2 text-fg-muted",
  rejected: "bg-surface-2 text-fg-muted",
  refunded: "bg-danger/12 text-danger",
  failed: "bg-danger/12 text-danger",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap", TONE[status] ?? "bg-surface-2 text-fg-muted", className)}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {label(status)}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand", className)}>{children}</span>;
}
