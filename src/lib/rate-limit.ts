import "server-only";
import { headers } from "next/headers";

// Simple fixed-window limiter, in memory. Good enough for one server instance; swap for
// Upstash/Redis if the site runs on many instances and abuse becomes a problem.
const hits = new Map<string, { count: number; reset: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function rateLimit(bucket: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `${bucket}:${await clientIp()}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
