import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { drawDraftExchange } from "@/lib/supabase/draw-flow";
import { processDueJobs } from "@/lib/email-queue";

/**
 * Scheduled draws: an organizer can set a future time on a collect-first
 * (draft) exchange; when that time passes, the names are drawn automatically
 * and assignments go out. The sweep runs inside the existing 5-minute email
 * cron, so the worst-case delay equals the cron interval.
 *
 * Concurrency: each due exchange is claimed with a conditional UPDATE that
 * clears scheduled_at — only the run whose update matches proceeds to draw.
 * On a retriable failure (not enough participants yet, unsolvable exclusions)
 * the schedule is restored so the next sweep tries again.
 */

export interface ScheduledDrawResult {
  due: number;
  drawn: Array<{ exchangeId: string; generation: number }>;
  deferred: number;
}

export async function sweepScheduledDraws(limit = 10): Promise<ScheduledDrawResult> {
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: due, error } = await db
    .from("exchange")
    .select("id, scheduled_at")
    .eq("status", "draft")
    .lte("scheduled_at", now)
    .order("scheduled_at")
    .limit(limit);
  if (error) throw new Error(`sweepScheduledDraws fetch failed: ${error.message}`);

  const result: ScheduledDrawResult = { due: 0, drawn: [], deferred: 0 };

  for (const ex of (due ?? []) as Array<{ id: string; scheduled_at: string }>) {
    result.due++;
    // Claim: clear scheduled_at only if it still holds the value we saw.
    const { data: claimed } = await db
      .from("exchange")
      .update({ scheduled_at: null })
      .eq("id", ex.id)
      .eq("status", "draft")
      .eq("scheduled_at", ex.scheduled_at)
      .select("id");
    if ((claimed?.length ?? 0) === 0) continue; // another worker took it

    try {
      const { generation } = await drawDraftExchange(ex.id);
      // Best-effort immediate send, same as the manual draw button.
      try {
        await processDueJobs({ exchangeId: ex.id, limit: 40 });
      } catch {
        // non-fatal: the cron worker retries pending jobs anyway
      }
      result.drawn.push({ exchangeId: ex.id, generation });
    } catch {
      // Retriable (people still joining / exclusions unsolvable): restore the
      // schedule so the next sweep retries. A permanent failure loops with the
      // cron cadence until the organizer fixes or cancels it — acceptable,
      // since nothing is emailed on a failed draw.
      await db
        .from("exchange")
        .update({ scheduled_at: ex.scheduled_at })
        .eq("id", ex.id)
        .eq("status", "draft")
        .is("scheduled_at", null);
      result.deferred++;
    }
  }

  return result;
}
