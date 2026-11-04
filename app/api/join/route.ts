import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { checkCreateRateLimit, clientIp } from "@/lib/rate-limit";
import { EMAIL_RE, MAX_PARTICIPANTS } from "@/lib/draw/participants";

/**
 * POST /api/join
 * Body: { token, name, email? }
 * Self-serve participant signup for collect-first exchanges. Only works while
 * the exchange is still in `draft` (nobody has drawn yet).
 */
const NAME_MAX = 60;

export async function POST(req: NextRequest) {
  let body: { token?: string; name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = verifyToken(String(body.token ?? ""));
  if (!payload || payload.t !== "j") {
    return NextResponse.json({ error: "This join link is not valid." }, { status: 403 });
  }

  const ip = clientIp(req.headers);
  const rate = await checkCreateRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many joins from your network right now. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec ?? 3600) } }
    );
  }

  const name = String(body.name ?? "").trim().slice(0, NAME_MAX);
  const email = String(body.email ?? "").toLowerCase().trim();
  if (!name) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: exchange } = await db
    .from("exchange")
    .select("status, delivery_mode")
    .eq("id", payload.x)
    .maybeSingle();
  if (!exchange) {
    return NextResponse.json({ error: "This draw no longer exists." }, { status: 404 });
  }
  if (exchange.status !== "draft") {
    return NextResponse.json(
      { error: "The names have already been drawn. Ask the organizer to send you your assignment." },
      { status: 409 }
    );
  }

  const emailMode = exchange.delivery_mode !== "link";
  if (emailMode && !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email — your assignment will be sent there." },
      { status: 400 }
    );
  }

  const { data: existingPeople } = await db
    .from("participant")
    .select("id, name, email, removed_at")
    .eq("exchange_id", payload.x);

  const people = existingPeople ?? [];
  if (people.filter((p) => !p.removed_at).length >= MAX_PARTICIPANTS) {
    return NextResponse.json(
      { error: `This draw is full (max ${MAX_PARTICIPANTS} people).` },
      { status: 409 }
    );
  }
  if (people.some((p) => !p.removed_at && p.name.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json(
      { error: `Someone called "${name}" has already joined. Pick a nickname (e.g. "Anna B.") if this is a different person.` },
      { status: 409 }
    );
  }
  if (emailMode && people.some((p) => !p.removed_at && p.email === email)) {
    return NextResponse.json(
      { error: "That email has already joined this draw." },
      { status: 409 }
    );
  }

  const { error } = await db.from("participant").insert({
    exchange_id: payload.x,
    name,
    email: emailMode ? email : null,
  });
  if (error) {
    // The unique (exchange_id, email) index is the concurrency backstop for
    // the duplicate check above.
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "That email has already joined this draw." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Could not join. Try again." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    joined: people.filter((p) => !p.removed_at).length + 1,
  });
}
