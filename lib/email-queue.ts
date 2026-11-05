import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { sendEmail } from "@/lib/mailer";
import { renderAssignmentEmail, renderCollectingEmail, renderOrganizerEmail, renderQuestionEmail, renderAnswerEmail, renderReminderEmail, renderWeResultEmail, kindLabel, budgetLabel, deadlineLabel, type ExchangeKind } from "@/lib/email-templates";
import { signToken } from "@/lib/tokens";

export type EmailJobKind =
  | "assignment"
  | "organizer_link"
  | "reminder"
  | "question"
  | "answer"
  | "we_result";

export interface EnqueueInput {
  exchangeId: string;
  kind: EmailJobKind;
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
  kind: EmailJobKind;
  giver_id: string | null;
  to_email: string;
  subject: string;
  attempts: number;
  max_attempts: number;
  payload: Record<string, unknown>;
}

/** Claim window: a claimed job is invisible to other workers for this long. */
const CLAIM_MINUTES = 5;

/**
 * Atomically claim one due job.
 *
 * Cron (external, every 5 min), the Vercel daily fallback and the inline
 * send after create/redraw/resend can overlap. Two workers must never send
 * the same email twice, so claiming is a conditional update: only the worker
 * whose UPDATE actually matches a still-pending, still-due row gets to send.
 */
async function claimJob(
  db: ReturnType<typeof getSupabaseAdmin>,
  job: JobRow,
  nowIso: string
): Promise<boolean> {
  const claimUntil = new Date(Date.now() + CLAIM_MINUTES * 60_000).toISOString();
  const { data } = await db
    .from("email_job")
    .update({ next_attempt_at: claimUntil })
    .eq("id", job.id)
    .eq("status", "pending")
    .lte("next_attempt_at", nowIso)
    .select("id");
  return (data?.length ?? 0) > 0;
}

/**
 * Process all due jobs (optionally scoped to one exchange).
 * Failures back off exponentially (2^n minutes, capped at 60) and are recorded
 * on the job row; after max_attempts the job is marked `failed` for the
 * organizer dashboard to show.
 */
export async function processDueJobs(
  opts: { exchangeId?: string; jobId?: string; limit?: number; concurrency?: number } = {}
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
  if (opts.jobId) query = query.eq("id", opts.jobId);

  const { data, error } = await query;
  if (error) throw new Error(`processDueJobs fetch failed: ${error.message}`);

  const jobs = (data ?? []) as unknown as JobRow[];
  const nowIso = new Date().toISOString();
  const result: QueueResult = { processed: 0, sent: 0, failed: 0, retriable: 0 };

  // Sending is I/O bound, so a small worker pool keeps a 100-person draw well
  // inside the serverless time budget without hammering Resend.
  await runWithConcurrency(jobs, opts.concurrency ?? 6, async (job) => {
    // Lost the claim race (another worker is already sending this one): skip.
    if (!(await claimJob(db, job, nowIso).catch(() => false))) return;
    result.processed++;

    let outcome: "sent" | "failed" | "retriable";
    try {
      outcome = await attemptJob(job);
    } catch {
      outcome = "retriable";
    }
    if (outcome === "sent") result.sent++;
    else if (outcome === "failed") result.failed++;
    else result.retriable++;
  });
  return result;
}

/** Run `worker` over `items` with at most `limit` in flight. */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  const queue = [...items];
  const size = Math.max(1, Math.min(limit, queue.length));
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (;;) {
        const item = queue.shift();
        if (item === undefined) return;
        await worker(item);
      }
    })
  );
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
        .eq("giver_id", job.giver_id)
        // A participant who removed their data mid-flight must not be flipped
        // back to an active delivery state.
        .neq("email_status", "cancelled");
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
    .select("id, draw_generation, organizer_email, title, kind, budget_amount, deadline")
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
    budget_amount: number | null;
    deadline: string | null;
  }>) {
    const budget = budgetLabel(ex.budget_amount);
    const deadline = deadlineLabel(ex.deadline);
    // Claim the exchange first: two overlapping cron runs must not enqueue
    // the reminder batch twice. Only the run whose conditional update wins
    // proceeds; on enqueue failure the flag is released for the next sweep.
    const { data: claimed, error: cerr } = await db
      .from("exchange")
      .update({ reminder_sent: true })
      .eq("id", ex.id)
      .eq("reminder_sent", false)
      .select("id");
    if (cerr) throw new Error(`sweepReminders claim failed: ${cerr.message}`);
    if ((claimed?.length ?? 0) === 0) continue;

    // assignment has no direct FK to participant (its FK targets pair), so a
    // single-hint embed is unresolvable and PostgREST rejects it. Fetch both
    // sides and join in code instead.
    const { data: rows, error: aerr } = await db
      .from("assignment")
      .select("giver_id, viewed_at")
      .eq("exchange_id", ex.id)
      .neq("email_status", "cancelled");
    if (aerr) {
      await db.from("exchange").update({ reminder_sent: false }).eq("id", ex.id);
      throw new Error(`sweepReminders assignments failed: ${aerr.message}`);
    }

    const giverIds = ((rows ?? []) as Array<{ giver_id: string }>).map((r) => r.giver_id);
    const viewedByGiver = new Set(
      ((rows ?? []) as Array<{ giver_id: string; viewed_at: string | null }>)
        .filter((r) => r.viewed_at)
        .map((r) => r.giver_id)
    );
    const people =
      giverIds.length === 0
        ? []
        : (
            await db
              .from("participant")
              .select("id, name, email, removed_at")
              .in("id", giverIds)
          ).data ?? [];

    type Person = { id: string; name: string; email: string | null; removed_at: string | null };
    const targets = ((people ?? []) as unknown as Person[]).filter(
      (p) => !viewedByGiver.has(p.id) && !p.removed_at && Boolean(p.email)
    );

    if (targets.length > 0) {
      try {
        await enqueueEmails(
          targets.map((p) => ({
            exchangeId: ex.id,
            kind: "reminder" as const,
            giverId: p.id,
            toEmail: p.email as string,
            subject: `Reminder: your ${kindLabel(ex.kind)} assignment`,
            payload: {
              name: p.name,
              kind: ex.kind,
              budget,
              deadline,
              token: signToken({ t: "a", x: ex.id, p: p.id, g: ex.draw_generation }),
              removeToken: signToken({ t: "r", x: ex.id, p: p.id }),
            },
          }))
        );
      } catch (e) {
        await db.from("exchange").update({ reminder_sent: false }).eq("id", ex.id);
        throw e;
      }
      enqueued += targets.length;
    }
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
  const kind = (job.payload.kind as ExchangeKind | undefined) ?? "secret_santa";
  const budget = budgetLabel(job.payload.budget);
  const deadline = deadlineLabel(job.payload.deadline);
  if (job.kind === "assignment") {
    return renderAssignmentEmail({
      name: String(job.payload.name ?? "there"),
      assignmentToken: String(job.payload.token ?? ""),
      removeToken: String(job.payload.removeToken ?? ""),
      kind,
      budget,
      deadline,
    });
  }
  if (job.kind === "reminder") {
    return renderReminderEmail({
      name: String(job.payload.name ?? "there"),
      assignmentToken: String(job.payload.token ?? ""),
      removeToken: String(job.payload.removeToken ?? ""),
      kind,
      budget,
      deadline,
    });
  }
  if (job.kind === "question") {
    return renderQuestionEmail({
      name: String(job.payload.name ?? "there"),
      questionText: String(job.payload.question ?? ""),
      answerToken: String(job.payload.token ?? ""),
      removeToken: String(job.payload.removeToken ?? ""),
      kind,
      title: (job.payload.title as string | undefined) ?? undefined,
    });
  }
  if (job.kind === "answer") {
    return renderAnswerEmail({
      name: String(job.payload.name ?? "there"),
      questionText: String(job.payload.question ?? ""),
      answerText: String(job.payload.answer ?? ""),
      assignmentToken: String(job.payload.token ?? ""),
      removeToken: String(job.payload.removeToken ?? ""),
      kind,
    });
  }
  if (job.kind === "we_result") {
    return renderWeResultEmail({
      name: String(job.payload.name ?? "there"),
      gift: String(job.payload.gift ?? "your present"),
      title: (job.payload.title as string | undefined) ?? undefined,
      kind,
    });
  }
  if (job.payload.collecting === true) {
    return renderCollectingEmail({
      title: String(job.payload.title ?? "your draw"),
      joinUrl: String(job.payload.joinUrl ?? ""),
      manageUrl: String(job.payload.manageUrl ?? ""),
      kind,
      deadline: (job.payload.deadline as string | undefined) ?? null,
    });
  }
  return renderOrganizerEmail({
    title: String(job.payload.title ?? "your draw"),
    manageToken: String(job.payload.token ?? ""),
    kind,
    blind: job.payload.blind === true,
    deliveryMode: job.payload.deliveryMode === "link" ? "link" : "email",
  });
}
