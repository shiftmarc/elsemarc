import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

/** The visitor's IP address as reported by the host (Vercel sets x-forwarded-for), or "unknown". */
export async function clientIp(): Promise<string> {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip")?.trim() || "unknown";
}

export async function userAgent(): Promise<string> {
  return ((await headers()).get("user-agent") ?? "").slice(0, 300);
}

/**
 * A keyed hash of the IP, so rate limits can be checked without storing
 * addresses. Keyed with the Supabase secret: rotating it simply starts the
 * counts afresh.
 */
export function hashIp(ip: string): string {
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? "contact").update(ip).digest("hex").slice(0, 32);
}

/**
 * A fixed-window limiter held in memory. On serverless hosting each instance
 * keeps its own counts, so it is a speed bump for bursts, not a guarantee;
 * the message count in the database is the durable limit.
 */
const windows = new Map<string, { start: number; count: number }>();

export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (windows.size > 5000) {
    for (const [stale, entry] of windows) if (now - entry.start > windowMs) windows.delete(stale);
  }
  const entry = windows.get(key);
  if (!entry || now - entry.start > windowMs) {
    windows.set(key, { start: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}
