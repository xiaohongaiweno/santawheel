import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { drawDraftExchange } from "@/lib/supabase/draw-flow";
import { processDueJobs } from "@/lib/email-queue";
import { UnsolvableDrawError } from "@/lib/draw/derangement";

/**
 * POST /api/manage/draw
 * Body: { token }
 * First draw of a collect-first exchange. Organizer-token gated.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = verifyToken(String(body.token ?? ""));
  if (!payload || payload.t !== "o") {
    return NextResponse.json({ error: "This organizer link is not valid." }, { status: 403 });
  }

  try {
    const { generation, links } = await drawDraftExchange(payload.x);
    // A manually executed draw supersedes any schedule the organizer set.
    await getSupabaseAdmin()
      .from("exchange")
      .update({ scheduled_at: null })
      .eq("id", payload.x)
      .eq("status", "drawn")
      .not("scheduled_at", "is", null);
    // Best-effort immediate send, same as creation: whatever exceeds the
    // function budget stays queued for the cron worker.
    let delivery: Awaited<ReturnType<typeof processDueJobs>> | null = null;
    try {
      delivery = await processDueJobs({ exchangeId: payload.x, limit: 40 });
    } catch {
      // non-fatal
    }
    return NextResponse.json({ ok: true, generation, links, delivery });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Draw failed";
    if (message.startsWith("ALREADY_DRAWN")) {
      return NextResponse.json(
        { error: "The names have already been drawn." },
        { status: 409 }
      );
    }
    if (message.startsWith("NEED_TWO")) {
      return NextResponse.json(
        { error: "At least 2 people must join before you can draw." },
        { status: 400 }
      );
    }
    if (e instanceof UnsolvableDrawError) {
      return NextResponse.json(
        { error: "No valid draw is possible with the current exclusions. Remove some exclusions and try again." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
