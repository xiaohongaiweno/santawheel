import { NextRequest, NextResponse } from "next/server";
import { loadWeContext, toBoardView } from "@/lib/supabase/we-flow";
import { exchangeIdFromBoardToken, weErrorBody } from "@/lib/we-token";

/**
 * Current board for a white elephant game. The page polls this while the
 * game is live (and instantly after each action), so a phone that reloads —
 * or a second phone watching — always sees the same state.
 */
export async function GET(req: NextRequest) {
  const exchangeId = exchangeIdFromBoardToken(req.nextUrl.searchParams.get("token"));
  if (!exchangeId) {
    return NextResponse.json({ error: "Invalid board link" }, { status: 403 });
  }

  try {
    const view = toBoardView(await loadWeContext(exchangeId));
    return NextResponse.json({ view }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    const { status, body } = weErrorBody(e);
    return NextResponse.json(body, { status });
  }
}
