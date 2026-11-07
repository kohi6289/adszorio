// Display helpers shared by server and client.

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  in_progress: "In progress",
  completed: "Completed",
  partial: "Partially delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  unpaid: "Awaiting payment",
  paid: "Paid",
  failed: "Failed",
  new: "New",
  contacted: "Contacted",
  converted: "Converted",
  lost: "Lost",
  received: "Received",
  rejected: "Rejected",
};

export const label = (s: string) => STATUS_LABEL[s] ?? s.replaceAll("_", " ");

export const fmtInt = (n: number) => n.toLocaleString("en-US");

export function fmtDateTime(iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function fmtUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export const LINK_LABEL: Record<string, string> = {
  profile: "profile link",
  post: "post link",
  reel: "reel link",
  video: "video link",
  short: "Shorts link",
  channel: "channel link",
};
