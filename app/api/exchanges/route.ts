import { NextRequest, NextResponse } from "next/server";
import { createAndDeliverExchange, type CreateExchangeInput } from "@/lib/supabase/draw-flow";
import { processDueJobs } from "@/lib/email-queue";
import { UnsolvableDrawError } from "@/lib/draw/derangement";
import { checkCreateRateLimit, clientIp } from "@/lib/rate-limit";
import { signToken } from "@/lib/tokens";

/**
 * POST /api/exchanges
 * Body: { title, organizerEmail, participants: [{name,email,wishlistUrl?}],
 *         exclusions?: [[email,email]], budgetAmount?, deadline?, kind? }
 * Creates the exchange, draws, persists pairs, enqueues and (best-effort)
 * immediately sends all emails. Participant emails + organizer dashboard link.
 * Rate limited per IP; participant count capped at 100.
 */
export async function POST(req: NextRequest) {
  let body: CreateExchangeInput;
  try {
    body = (await req.json()) as CreateExchangeInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ip = clientIp(req.headers);
  const rate = await checkCreateRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          "Too many draws created from your network in the last hour. Please try again later.",
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec ?? 3600) } }
    );
  }

  let exchangeId: string;
  let reused = false;
  let links: Awaited<ReturnType<typeof createAndDeliverExchange>>["links"] = [];
  let joinPath: string | undefined;
  try {
    // UI sends hyphenated kinds ("secret-santa"); the DB stores underscored
    // values per the exchange_kind_check constraint.
    const kind = body.kind?.replace(/-/g, "_") as CreateExchangeInput["kind"];
    const result = await createAndDeliverExchange({
      ...body,
      kind,
      createdByIp: ip,
      requestId: body.requestId,
    });
    exchangeId = result.exchangeId;
    reused = result.reused;
    links = result.links;
    joinPath = result.joinPath;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create exchange";
    // A missing migration is an operator problem, not a bad request: say so
    // plainly instead of blaming the organizer.
    if (/migration/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    const badRequest =
      e instanceof UnsolvableDrawError ||
      /required|Invalid|Duplicate|unknown participant|Up to 100|At least 2|Exclusion|requestId|called|Blind mode|needs an email/i.test(
        message
      );
    return NextResponse.json({ error: message }, { status: badRequest ? 400 : 500 });
  }

  // Hand the creator their dashboard link directly, so a mistyped or filtered
  // organizer email cannot lock them out of their own draw.
  const managePath = `/manage/${signToken({ t: "o", x: exchangeId })}`;

  // A retried submission already delivered (or is delivering) this exchange.
  // Never send the same assignment emails twice.
  if (reused) {
    // Link-mode retries must still get their links back: the first response may
    // have been lost to a flaky connection, and an empty success page would
    // leave the organizer with nothing to hand out.
    return NextResponse.json(
      { exchangeId, reused: true, delivery: null, managePath, links, joinPath },
      { status: 200 }
    );
  }

  // Collect-first draws only emailed the organizer a join link; there is
  // nothing else to deliver until the organizer draws the names. Still flush
  // the queue inline so that email goes out with the response, not hours
  // later whenever the cron fires.
  if (joinPath) {
    let delivery: Awaited<ReturnType<typeof processDueJobs>> | null = null;
    try {
      delivery = await processDueJobs({ exchangeId, limit: 10 });
    } catch {
      // non-fatal
    }
    return NextResponse.json(
      { exchangeId, delivery, managePath, links: [], joinPath },
      { status: 201 }
    );
  }

  // Best-effort immediate send. Capped so a 100-person draw cannot exceed the
  // serverless function budget: whatever is left stays queued for the cron
  // worker, which retries it within minutes.
  let delivery: Awaited<ReturnType<typeof processDueJobs>> | null = null;
  try {
    delivery = await processDueJobs({ exchangeId, limit: 40 });
  } catch {
    // queue processing errors are non-fatal for the caller
  }

  return NextResponse.json({ exchangeId, delivery, managePath, links }, { status: 201 });
}
