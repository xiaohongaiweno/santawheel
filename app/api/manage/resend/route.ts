import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { processDueJobs } from "@/lib/email-queue";
import { kindLabel, type ExchangeKind } from "@/lib/email-templates";

/**
 * POST /api/manage/resend  { token, giverId? }
 * Organizer-only (signed token). Re-queues one participant email, or the
 * organizer dashboard email when giverId is omitted.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; giverId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body.token ? verifyToken(body.token) : null;
  if (!payload || payload.t !== "o") {
    return NextResponse.json({ error: "Invalid or expired organizer link" }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const exchangeId = payload.x;

  const { data: exchange } = await db
    .from("exchange")
    .select("title, organizer_email, status, draw_generation, kind")
    .eq("id", exchangeId)
    .maybeSingle();
  if (!exchange) return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
  const exKind = (exchange.kind as ExchangeKind) ?? "secret_santa";

  let toEmail: string;
  let kind: "assignment" | "organizer_link";
  let giverId: string | null = null;
  let subject: string;
  let jobPayload: Record<string, unknown>;

  if (body.giverId) {
    if (exchange.status !== "drawn") {
      return NextResponse.json({ error: "Draw has not been run" }, { status: 400 });
    }
    const { data: p } = await db
      .from("participant")
      .select("id, name, email, removed_at")
      .eq("exchange_id", exchangeId)
      .eq("id", body.giverId)
      .maybeSingle();
    if (!p || p.removed_at) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }
    kind = "assignment";
    giverId = p.id as string;
    toEmail = p.email as string;
    subject = `Your ${kindLabel(exKind)} assignment`;
    jobPayload = {
      name: p.name,
      kind: exKind,
      token: signToken({ t: "a", x: exchangeId, p: p.id as string, g: exchange.draw_generation }),
      removeToken: signToken({ t: "r", x: exchangeId, p: p.id as string }),
    };
    await db
      .from("assignment")
      .update({ email_status: "pending", attempts: 0, last_error: null })
      .eq("exchange_id", exchangeId)
      .eq("giver_id", giverId);
  } else {
    kind = "organizer_link";
    toEmail = exchange.organizer_email as string;
    subject = "Your SantaWheel draw is ready";
    jobPayload = { title: exchange.title, kind: exKind, token: body.token };
  }

  // Re-queue with a clean attempt count (fresh 5 attempts + backoff).
  const { error } = await db.from("email_job").insert({
    exchange_id: exchangeId,
    kind,
    giver_id: giverId,
    to_email: toEmail,
    subject,
    payload: jobPayload,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result = await processDueJobs({ exchangeId, limit: 1 }).catch(() => null);
  return NextResponse.json({ ok: true, delivery: result });
}
