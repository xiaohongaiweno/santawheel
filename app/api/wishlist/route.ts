import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";

/**
 * POST /api/wishlist
 * Body: { token, wishlistText }
 * Lets a participant edit their own wishlist from their assignment link
 * (works in both email and private-link delivery modes). The gifter sees it
 * on the same page that shows who they are drawing for.
 */
const MAX_LEN = 1000;

export async function POST(req: NextRequest) {
  let body: { token?: string; wishlistText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = verifyToken(String(body.token ?? ""));
  if (!payload || payload.t !== "a") {
    return NextResponse.json({ error: "This link is not valid." }, { status: 403 });
  }

  const text = String(body.wishlistText ?? "").slice(0, MAX_LEN);

  const db = getSupabaseAdmin();
  const { data: participant } = await db
    .from("participant")
    .select("removed_at")
    .eq("id", payload.p)
    .eq("exchange_id", payload.x)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 });
  }
  if (participant.removed_at) {
    return NextResponse.json(
      { error: "You have been removed from this draw." },
      { status: 403 }
    );
  }

  const { error } = await db
    .from("participant")
    .update({ wishlist_text: text.trim() || null })
    .eq("id", payload.p)
    .eq("exchange_id", payload.x);
  if (error) {
    return NextResponse.json({ error: "Could not save. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
