import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { importParticipants } from "@/lib/supabase/draw-flow";
import { parseParticipantImport } from "@/lib/import-parser";

/**
 * POST /api/manage/import  { token, text }  (organizer token, premium only)
 * Bulk-import participants from pasted CSV/TSV (Excel copy-paste works).
 * New participants join on the next "Reset & redraw".
 */
export async function POST(req: NextRequest) {
  let body: { token?: string; text?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const payload = body.token ? verifyToken(body.token) : null;
  if (!payload || payload.t !== "o") {
    return NextResponse.json({ error: "Invalid organizer link" }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const { data: exchange } = await db
    .from("exchange")
    .select("paid")
    .eq("id", payload.x)
    .maybeSingle();
  if (!exchange) return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
  if (!exchange.paid) {
    return NextResponse.json(
      { error: "Bulk import is a premium feature" },
      { status: 402 }
    );
  }

  const parsed = parseParticipantImport(body.text ?? "");
  if (parsed.errors.length > 0 && parsed.participants.length === 0) {
    return NextResponse.json({ error: "Nothing importable found", details: parsed.errors }, { status: 400 });
  }

  try {
    const { added, skipped } = await importParticipants(payload.x, parsed.participants);
    return NextResponse.json({
      ok: true,
      added,
      skipped,
      lineErrors: parsed.errors,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 }
    );
  }
}
