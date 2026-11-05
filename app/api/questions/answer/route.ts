import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { processDueJobs } from "@/lib/email-queue";
import {
  answerAnonymousQuestion,
  QuestionError,
} from "@/lib/supabase/qa";

/**
 * POST /api/questions/answer
 * Body: { token, questionId, answer }
 * Receiver answers an anonymous question. Two valid token shapes:
 *  - the receiver's own assignment token (from their /a page)
 *  - the per-question answer token emailed to them (carries the question id)
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; questionId?: string; answer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = verifyToken(String(body.token ?? ""));
  if (!payload) {
    return NextResponse.json({ error: "This link is not valid." }, { status: 403 });
  }

  const questionId = String(body.questionId ?? "");
  if (!questionId) {
    return NextResponse.json({ error: "Missing question." }, { status: 400 });
  }

  let exchangeId: string;
  let receiverId: string;

  if (payload.t === "a") {
    // Receiver acting from their own assignment page.
    exchangeId = payload.x;
    receiverId = payload.p;
  } else if (payload.t === "q") {
    // Receiver acting from the emailed answer link; the token binds the
    // question id, so the body's questionId must match it.
    if (payload.q !== questionId) {
      return NextResponse.json({ error: "This link is not valid." }, { status: 403 });
    }
    exchangeId = payload.x;
    const db = getSupabaseAdmin();
    const { data: q } = await db
      .from("question")
      .select("receiver_id")
      .eq("id", questionId)
      .eq("exchange_id", exchangeId)
      .maybeSingle();
    if (!q) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }
    receiverId = q.receiver_id as string;
  } else {
    return NextResponse.json({ error: "This link is not valid." }, { status: 403 });
  }

  try {
    await answerAnonymousQuestion({
      exchangeId,
      receiverId,
      questionId,
      answerText: String(body.answer ?? ""),
    });
  } catch (e) {
    if (e instanceof QuestionError) {
      const msg = e.message;
      const status = msg.startsWith("ANSWERED") ? 409 : 400;
      return NextResponse.json(
        { error: msg.replace(/^[A-Z_]+: /, "") },
        { status }
      );
    }
    return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
  }

  // Best-effort immediate send so the answer lands quickly.
  let delivery: Awaited<ReturnType<typeof processDueJobs>> | null = null;
  try {
    delivery = await processDueJobs({ exchangeId, limit: 10 });
  } catch {
    // non-fatal
  }

  return NextResponse.json({ ok: true, delivery });
}
