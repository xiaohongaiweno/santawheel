import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { purgeExchange } from "@/lib/supabase/draw-flow";

/**
 * POST /api/manage/delete  { token, confirm: "DELETE" }
 *
 * Organizer-initiated GDPR deletion: removes the exchange, every participant
 * name and email, the pairings, the queue and the no-repeat history. Pairs are
 * immutability-protected, so this goes through the purge_exchange() RPC.
 *
 * Irreversible, so the body must literally say "DELETE" — a stray click on a
 * cached dashboard must not be able to destroy last year's draw.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; confirm?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body.token ? verifyToken(body.token) : null;
  if (!payload || payload.t !== "o") {
    return NextResponse.json({ error: "Invalid or expired organizer link" }, { status: 403 });
  }

  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Type DELETE to confirm — this cannot be undone.' },
      { status: 400 }
    );
  }

  try {
    await purgeExchange(payload.x);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    // Missing migration is an operator problem, not a client error.
    if (/migration/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 503 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
