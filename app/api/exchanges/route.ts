import { NextRequest, NextResponse } from "next/server";
import { createAndDeliverExchange, type CreateExchangeInput } from "@/lib/supabase/draw-flow";
import { processDueJobs } from "@/lib/email-queue";
import { UnsolvableDrawError } from "@/lib/draw/derangement";
import { checkCreateRateLimit, clientIp } from "@/lib/rate-limit";

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
  try {
    const result = await createAndDeliverExchange({ ...body, createdByIp: ip });
    exchangeId = result.exchangeId;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create exchange";
    const badRequest =
      e instanceof UnsolvableDrawError ||
      /required|Invalid|Duplicate|unknown participant|Up to 100|At least 2|Exclusion/i.test(message);
    return NextResponse.json({ error: message }, { status: badRequest ? 400 : 500 });
  }

  // Best-effort immediate send; anything that fails stays in the queue with
  // backoff (cron retries it) and shows up on the organizer dashboard.
  let delivery: Awaited<ReturnType<typeof processDueJobs>> | null = null;
  try {
    delivery = await processDueJobs({ exchangeId, limit: 200 });
  } catch {
    // queue processing errors are non-fatal for the caller
  }

  return NextResponse.json({ exchangeId, delivery }, { status: 201 });
}
