import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { redrawExchange } from "@/lib/supabase/draw-flow";
import { processDueJobs } from "@/lib/email-queue";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";

/**
 * POST /api/manage/redraw  { token }
 * Organizer-only. Resets the whole draw: revokes every previously issued
 * link (generation bump), hard-deletes removed participants, redraws with
 * exclusions intact, and re-emails everyone.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body.token ? verifyToken(body.token) : null;
  if (!payload || payload.t !== "o") {
    return NextResponse.json({ error: "Invalid or expired organizer link" }, { status: 403 });
  }

  // Cooldown: a redraw re-emails everyone. Refuse a second one within a minute
  // so a double click (or an impatient refresh) cannot spam every participant.
  const { count } = await getSupabaseAdmin()
    .from("email_job")
    .select("id", { count: "exact", head: true })
    .eq("exchange_id", payload.x)
    .eq("kind", "assignment")
    .gte("created_at", new Date(Date.now() - 60_000).toISOString());
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: "A draw was just sent out. Please wait a minute before redrawing." },
      { status: 429 }
    );
  }

  try {
    const { generation } = await redrawExchange(payload.x);
    const delivery = await processDueJobs({ exchangeId: payload.x, limit: 40 }).catch(() => null);
    return NextResponse.json({ ok: true, generation, delivery });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Redraw failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
