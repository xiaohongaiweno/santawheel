import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { exchangePolicy } from "@/lib/exchange-visibility";
import type { ParticipantRow } from "@/lib/supabase/draw-service";

/**
 * GET /api/manage/csv?token=<organizer token>
 * Downloads every pair as CSV: Giver Name, Giver Email, Receiver Name, Receiver Email.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const payload = verifyToken(token);
  if (!payload || payload.t !== "o") {
    return NextResponse.json({ error: "Invalid or expired organizer link" }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const { data: exchange } = await db
    .from("exchange")
    .select("*")
    .eq("id", payload.x)
    .maybeSingle();
  if (!exchange) return NextResponse.json({ error: "Exchange not found" }, { status: 404 });

  // Blind mode: the whole point is that no full pairing list is ever handed
  // out. Refuse before the pairs are even queried.
  if (exchangePolicy(exchange).blind) {
    return NextResponse.json(
      {
        error:
          "This draw is in blind mode — pairings are never exported. Each participant can still open their own link.",
      },
      { status: 403 }
    );
  }

  const [{ data: participants }, { data: pairs }] = await Promise.all([
    db.from("participant").select("*").eq("exchange_id", payload.x),
    db.from("pair").select("giver_id, receiver_id").eq("exchange_id", payload.x),
  ]);

  const byId = new Map(
    ((participants ?? []) as unknown as ParticipantRow[]).map((p) => [p.id, p])
  );
  const rows = [["Giver Name", "Giver Email", "Receiver Name", "Receiver Email"]];
  for (const pair of ((pairs ?? []) as unknown as Array<{ giver_id: string; receiver_id: string }>).sort(
    (a, b) =>
      (byId.get(a.giver_id)?.name ?? "").localeCompare(byId.get(b.giver_id)?.name ?? "")
  )) {
    const giver = byId.get(pair.giver_id);
    const receiver = byId.get(pair.receiver_id);
    rows.push([
      giver?.name ?? "?",
      giver?.email ?? "",
      receiver?.name ?? "?",
      receiver?.email ?? "",
    ]);
  }

  // Attribution stays on organizer-side exports only — participant assignment
  // pages, emails and screenshots are always watermark-free.
  rows.push([], ["Made with SantaWheel", "https://santawheel.com"]);

  const csv = rows
    .map((r) => r.map((cell) => `"${(cell ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\r\n");

  const slug = (exchange.title as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "exchange";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="santawheel-${slug}-pairs.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
