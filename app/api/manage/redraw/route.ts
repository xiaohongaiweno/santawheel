import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { redrawExchange } from "@/lib/supabase/draw-flow";
import { processDueJobs } from "@/lib/email-queue";

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

  try {
    const { generation } = await redrawExchange(payload.x);
    const delivery = await processDueJobs({ exchangeId: payload.x, limit: 200 }).catch(() => null);
    return NextResponse.json({ ok: true, generation, delivery });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Redraw failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
