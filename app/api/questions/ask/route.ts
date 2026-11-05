import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { processDueJobs } from "@/lib/email-queue";
import {
  askAnonymousQuestion,
  QuestionError,
} from "@/lib/supabase/qa";

/**
 * POST /api/questions/ask
 * Body: { token, question }
 * Anonymous question from a gifter to the person they are drawing.
 * Gated by the gifter's own assignment token; identity is never exposed.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; question?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = verifyToken(String(body.token ?? ""));
  if (!payload || payload.t !== "a") {
    return NextResponse.json({ error: "This link is not valid." }, { status: 403 });
  }

  try {
    await askAnonymousQuestion({
      exchangeId: payload.x,
      giverId: payload.p,
      questionText: String(body.question ?? ""),
    });
  } catch (e) {
    if (e instanceof QuestionError) {
      const msg = e.message;
      const status = msg.startsWith("PAIR_NOT_FOUND") || msg.startsWith("REMOVED")
        ? 409
        : msg.startsWith("LIMIT")
          ? 429
          : 400;
      return NextResponse.json(
        { error: msg.replace(/^[A-Z_]+: /, "") },
        { status }
      );
    }
    return NextResponse.json({ error: "Could not send. Try again." }, { status: 500 });
  }

  // Best-effort immediate send so the question lands quickly.
  let delivery: Awaited<ReturnType<typeof processDueJobs>> | null = null;
  try {
    delivery = await processDueJobs({ exchangeId: payload.x, limit: 10 });
  } catch {
    // non-fatal
  }

  return NextResponse.json({ ok: true, delivery });
}
