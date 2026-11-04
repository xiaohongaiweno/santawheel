import { getSupabaseAdmin } from "@/lib/supabase/draw-service";

/**
 * Abuse protection for the anonymous create endpoint: an IP may create at
 * most `limit` exchanges per rolling window. Counted from the exchange table
 * (created_by_ip), so it works on serverless with no extra infrastructure.
 * Fails open on infra errors — a flaky check must not block real organizers.
 */
export async function checkCreateRateLimit(
  ip: string,
  limit = 5,
  windowMs = 60 * 60 * 1000
): Promise<{ allowed: boolean; retryAfterSec?: number }> {
  try {
    const db = getSupabaseAdmin();
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count, error } = await db
      .from("exchange")
      .select("id", { count: "exact", head: true })
      .eq("created_by_ip", ip)
      .gte("created_at", since);

    if (error) return { allowed: true };
    const used = count ?? 0;
    if (used < limit) return { allowed: true };
    return { allowed: false, retryAfterSec: Math.ceil(windowMs / 1000) };
  } catch {
    // Fail open — infra problems must not block real organizers.
    return { allowed: true };
  }
}

/** Client IP from Vercel's forwarded headers (first hop only). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}
