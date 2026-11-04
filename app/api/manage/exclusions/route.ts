import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { parseExclusionLines } from "@/lib/import-parser";

/**
 * POST /api/manage/exclusions
 * Body: { token, exclusionsText }
 * Replace-all exclusions editor for collect-first exchanges: participants
 * self-join, so the organizer sets "who can't draw whom" here right before
 * drawing. Accepts the same one-pair-per-line format as the creation form
 * ("Alice - Bob" or "alice@mail.com - bob@mail.com").
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; exclusionsText?: string };
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
    return NextResponse.json({ error: "This draw no longer exists." }, { status: 404 });
  }
  if (exchange.status !== "draft") {
    return NextResponse.json(
      { error: "Exclusions are locked once the names have been drawn." },
      { status: 409 }
    );
  }

  const { data: people } = await db
    .from("participant")
    .select("id, name, email, removed_at")
    .eq("exchange_id", payload.x);

  const active = (people ?? [])
    .filter((p) => !p.removed_at)
    .map((p) => ({ name: p.name, email: p.email ?? undefined }));

  const { pairs, errors } = parseExclusionLines(String(body.exclusionsText ?? ""), active);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  // Replace-all keeps the model simple: the textarea is the source of truth.
  const { error: delErr } = await db
    .from("exclusion")
    .delete()
    .eq("exchange_id", payload.x);
  if (delErr) {
    return NextResponse.json({ error: "Could not update exclusions." }, { status: 500 });
  }

  if (pairs.length > 0) {
    // Resolve refs (email or unique name) back to ids, normalized a < b.
    const byRef = new Map<string, string>();
    for (const p of (people ?? []).filter((p) => !p.removed_at)) {
      if (p.email) byRef.set(p.email.toLowerCase(), p.id);
      byRef.set(p.name.toLowerCase(), p.id);
    }
    const rows = pairs
      .map(([a, b]) => {
        const ia = byRef.get(a.toLowerCase());
        const ib = byRef.get(b.toLowerCase());
        if (!ia || !ib || ia === ib) return null;
        return ia < ib ? { exchange_id: payload.x, participant_a: ia, participant_b: ib } : { exchange_id: payload.x, participant_a: ib, participant_b: ia };
      })
      .filter((r): r is { exchange_id: string; participant_a: string; participant_b: string } => r !== null);
    if (rows.length > 0) {
      const { error: insErr } = await db.from("exclusion").insert(rows);
      if (insErr) {
        return NextResponse.json({ error: "Could not save exclusions." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true, count: pairs.length });
}
