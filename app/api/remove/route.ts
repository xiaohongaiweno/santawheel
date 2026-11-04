import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { redactParticipant } from "@/lib/supabase/draw-flow";

/**
 * POST /api/remove  { token }
 * GDPR removal entry point — token comes from the footer of the participant's
 * own email or from their assignment page. Redacts their personal data
 * immediately; the row is hard-deleted on the organizer's next reset.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body.token ? verifyToken(body.token) : null;
  if (!payload || payload.t !== "r") {
    return NextResponse.json({ error: "Invalid removal link" }, { status: 403 });
  }

  try {
    await redactParticipant(payload.x, payload.p);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Removal failed" },
      { status: 500 }
    );
  }
}
