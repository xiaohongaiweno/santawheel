import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";

/**
 * POST /api/manage/schedule
 * Body: { token, scheduledAt: string | null }
 * Set or cancel a scheduled draw on a collect-first (draft) exchange.
 * scheduledAt is an ISO datetime; when it passes, the email cron draws the
 * names automatically (within the cron's 5-minute interval).
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; scheduledAt?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = verifyToken(String(body.token ?? ""));
  if (!payload || payload.t !== "o") {
    return NextResponse.json({ error: "This organizer link is not valid." }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const { data: exchange } = await db
    .from("exchange")
    .select("status")
    .eq("id", payload.x)
    .maybeSingle();
  if (!exchange) {
    return NextResponse.json({ error: "Draw not found." }, { status: 404 });
  }
  if (exchange.status !== "draft") {
    return NextResponse.json(
      { error: "The names are already drawn — scheduling only applies before the draw." },
      { status: 409 }
    );
  }

  const raw = body.scheduledAt;
  if (raw === null || raw === undefined || raw === "") {
    const { error } = await db
      .from("exchange")
      .update({ scheduled_at: null })
      .eq("id", payload.x);
    if (error) {
      return NextResponse.json({ error: "Could not update. Try again." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, scheduledAt: null });
  }

  const when = new Date(String(raw));
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: "That date and time is not valid." }, { status: 400 });
  }
  if (when.getTime() < Date.now() - 60_000) {
    return NextResponse.json(
      { error: "Pick a time in the future." },
      { status: 400 }
    );
  }
  // Far-future guard: nothing sane needs to schedule a draw years out.
  if (when.getTime() > Date.now() + 366 * 24 * 60 * 60 * 1000) {
    return NextResponse.json(
      { error: "Schedule the draw within the next year." },
      { status: 400 }
    );
  }

  const { error } = await db
    .from("exchange")
    .update({ scheduled_at: when.toISOString() })
    .eq("id", payload.x);
  if (error) {
    return NextResponse.json({ error: "Could not update. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scheduledAt: when.toISOString() });
}
