import { NextRequest, NextResponse } from "next/server";
import { createAndDeliverExchange, type CreateExchangeInput } from "@/lib/supabase/draw-flow";
import { processDueJobs } from "@/lib/email-queue";

/**
 * POST /api/exchanges
 * Body: { title, organizerEmail, participants: [{name,email,wishlistUrl?}],
 *         exclusions?: [[email,email]], budgetAmount?, deadline? }
 * Creates the exchange, draws, persists pairs, enqueues and (best-effort)
 * immediately sends all emails. Participant emails + organizer dashboard link.
 */
export async function POST(req: NextRequest) {
  let body: CreateExchangeInput;
  try {
    body = (await req.json()) as CreateExchangeInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let exchangeId: string;
  try {
    const result = await createAndDeliverExchange(body);
    exchangeId = result.exchangeId;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create exchange";
    const status = /UnsolvableDrawError|required|Invalid|Duplicate|unknown participant/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
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
