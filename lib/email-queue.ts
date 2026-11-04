import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { sendEmail } from "@/lib/mailer";
import { renderAssignmentEmail, renderOrganizerEmail, renderReminderEmail, kindLabel, type ExchangeKind } from "@/lib/email-templates";
import { signToken } from "@/lib/tokens";

export interface EnqueueInput {
  exchangeId: string;
  kind: "assignment" | "organizer_link" | "reminder";
  giverId?: string | null;
  toEmail: string;
  subject: string;
  payload: Record<string, unknown>;
}

export async function enqueueEmails(jobs: EnqueueInput[]): Promise<void> {
  if (jobs.length === 0) return;
  const db = getSupabaseAdmin();
  const { error } = await db.from("email_job").insert(
    jobs.map((j) => ({
      exchange_id: j.exchangeId,
      kind: j.kind,
      giver_id: j.giverId ?? null,
      to_email: j.toEmail,
      subject: j.subject,
      payload: j.payload,
    }))
  );
  if (error) throw new Error(`enqueueEmails failed: ${error.message}`);
}

export interface QueueResult {
  processed: number;
  sent: number;
  failed: number;
  retriable: number;
}

interface JobRow {
  id: string;
  exchange_id: string;
  kind: "assignment" | "organizer_link" | "reminder";
  giver_id: string | null;
  to_email: string;
  subject: string;
  attempts: number;
  max_attempts: number;
  payload: Record<string, unknown>;
}

/**
 * Process all due jobs (optionally scoped to one exchange).
 * Failures back off exponentially (2^n minutes, capped at 60) and are recorded
 * on the job row; after max_attempts the job is marked `failed` for the
 * organizer dashboard to show.
 */
export async function processDueJobs(
  opts: { exchangeId?: string; limit?: number } = {}
): Promise<QueueResult> {
  const db = getSupabaseAdmin();
  const limit = opts.limit ?? 25;

  let query = db
    .from("email_job")
    .select("*")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at")
    .limit(limit);
  if (opts.exchangeId) query = query.eq("exchange_id", opts.exchangeId);

  const { data, error } = await query;
  if (error) throw new Error(`processDueJobs fetch failed: ${error.message}`);

  const result: QueueResult = { processed: 0, sent: 0, failed: 0, retriable: 0 };
  for (const job of (data ?? []) as unknown as JobRow[]) {
    result.processed++;
    const outcome = await attemptJob(job);
    if (outcome === "sent") result.sent++;
    else if (outcome === "failed") result.failed++;
    else result.retriable++;
  }
  return result;
}

async function attemptJob(job: JobRow): Promise<"sent" | "failed" | "retriable"> {
  const db = getSupabaseAdmin();

  // Render fresh from the self-contained payload.
  let rendered;
  try {
    rendered = render(job);
  } catch (e) {
    await markJobError(db, job, e instanceof Error ? e.message : String(e), true);
    return "failed";
  }

  try {
    await sendEmail({
      to: job.to_email,
      subject: job.subject,
      html: rendered.html,
      text: rendered.text,
    });

    const now = new Date().toISOString();
    await db
      .from("email_job")
      .update({
        status: "sent",
        attempts: job.attempts + 1,
        sent_at: now,
        last_error: null,
      })
      .eq("id", job.id);

    if (job.kind === "assignment" && job.giver_id) {
      await db
        .from("assignment")
        .update({ email_status: "sent", sent_at: now, last_error: null })
        .eq("exchange_id", job.exchange_id)
        .eq("giver_id", job.giver_id);
    }
    return "sent";
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const attempts = job.attempts + 1;
    const exhausted = attempts >= job.max_attempts;
    await markJobError(db, job, message, exhausted);
    return exhausted ? "failed" : "retriable";
  }
}

/**
 * Premium: one scheduled reminder sweep for each paid exchange. Participants
 * who never opened their assignment link get a reminder email through the
 * same retry queue.
 */
export async function sweepReminders(limit = 20): Promise<{ exchanges: number; enqueued: number }> {
  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data: due, error } = await db
    .from("exchange")
    .select("id, draw_generation, organizer_email, title, kind")
    .eq("paid", true)
    .eq("status", "drawn")
    .eq("reminder_sent", false)
    .lte("reminder_at", now)
    .limit(limit);
  if (error) throw new Error(`sweepReminders fetch failed: ${error.message}`);

  let enqueued = 0;
  for (const ex of (due ?? []) as Array<{
    id: string;
    draw_generation: number;
    organizer_email: string;
    title: string;
    kind: ExchangeKind;
  }>) {
    const { data: rows, error: aerr } = await db
      .from("assignment")
      .select("giver_id, viewed_at, participant!assignment_giver_id_fkey(name, email, removed_at)")
      .eq("exchange_id", ex.id)
      .neq("email_status", "cancelled");
    if (aerr) throw new Error(`sweepReminders assignments failed: ${aerr.message}`);

    type Row = {
      giver_id: string;
      viewed_at: string | null;
      participant: { name: string; email: string; removed_at: string | null };
    };
    const targets = ((rows ?? []) as unknown as Row[]).filter(
      (r) => !r.viewed_at && !r.participant.removed_at
    );

    if (targets.length > 0) {
      await enqueueEmails(
        targets.map((r) => ({
          exchangeId: ex.id,
          kind: "reminder" as const,
          giverId: r.giver_id,
          toEmail: r.participant.email,
          subject: `Reminder: your ${kindLabel(ex.kind)} assignment`,
          payload: {
            name: r.participant.name,
            kind: ex.kind,
            token: signToken({ t: "a", x: ex.id, p: r.giver_id, g: ex.draw_generation }),
            removeToken: signToken({ t: "r", x: ex.id, p: r.giver_id }),
          },
        }))
      );
      enqueued += targets.length;
    }

    await db.from("exchange").update({ reminder_sent: true }).eq("id", ex.id);
  }
  return { exchanges: (due ?? []).length, enqueued };
}

async function markJobError(
  db: ReturnType<typeof getSupabaseAdmin>,
  job: JobRow,
  message: string,
  exhausted: boolean
) {
  const attempts = job.attempts + 1;
  const backoffMin = Math.min(2 ** attempts, 60);
  await db
    .from("email_job")
    .update({
      attempts,
      last_error: message.slice(0, 500),
      status: exhausted ? "failed" : "pending",
      next_attempt_at: new Date(Date.now() + backoffMin * 60_000).toISOString(),
    })
    .eq("id", job.id);

  if (exhausted && job.kind === "assignment" && job.giver_id) {
    await db
      .from("assignment")
      .update({
        email_status: "failed",
        attempts,
        last_error: message.slice(0, 500),
      })
      .eq("exchange_id", job.exchange_id)
      .eq("giver_id", job.giver_id);
  }
}

function render(job: JobRow): { html: string; text: string } {
  const kind = (job.payload.kind as ExchangeKind | undefined) ?? "secret-santa";
  if (job.kind === "assignment") {
    return renderAssignmentEmail({
      name: String(job.payload.name ?? "there"),
      assignmentToken: String(job.payload.token ?? ""),
      removeToken: String(job.payload.removeToken ?? ""),
      kind,
    });
  }
  if (job.kind === "reminder") {
    return renderReminderEmail({
      name: String(job.payload.name ?? "there"),
      assignmentToken: String(job.payload.token ?? ""),
      removeToken: String(job.payload.removeToken ?? ""),
      kind,
    });
  }
  return renderOrganizerEmail({
    title: String(job.payload.title ?? "your draw"),
    manageToken: String(job.payload.token ?? ""),
    kind,
  });
}
