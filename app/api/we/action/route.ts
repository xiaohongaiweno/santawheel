import { NextRequest, NextResponse } from "next/server";
import {
  actOnGame,
  finishGame,
  setStealLimit,
  setTurnOrder,
  startGame,
  undoLastAction,
  type WeBoardView,
} from "@/lib/supabase/we-flow";
import { exchangeIdFromBoardToken, weErrorBody } from "@/lib/we-token";

/**
 * One endpoint for every board move. The state machine decides legality; this
 * route only authenticates the board token and dispatches.
 *
 *   { token, action: "pick" | "steal", giftId }
 *   { token, action: "undo" }
 *   { token, action: "start", order?: string[] }
 *   { token, action: "order", order: string[] }
 *   { token, action: "steal-limit", limit: number }
 *   { token, action: "finish" }
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const exchangeId = exchangeIdFromBoardToken(body.token);
  if (!exchangeId) {
    return NextResponse.json({ error: "Invalid board link" }, { status: 403 });
  }

  const action = String(body.action ?? "");

  try {
    let view: WeBoardView;
    switch (action) {
      case "pick":
      case "steal": {
        const giftId = String(body.giftId ?? "");
        if (!giftId) return NextResponse.json({ error: "giftId is required" }, { status: 400 });
        view = await actOnGame(exchangeId, { type: action, giftId });
        break;
      }
      case "undo":
        view = await undoLastAction(exchangeId);
        break;
      case "start":
        view = await startGame(
          exchangeId,
          Array.isArray(body.order) ? (body.order as string[]) : undefined
        );
        break;
      case "order":
        view = await setTurnOrder(exchangeId, body.order);
        break;
      case "steal-limit":
        view = await setStealLimit(exchangeId, body.limit);
        break;
      case "finish": {
        const result = await finishGame(exchangeId);
        return NextResponse.json(
          { view: result.view, queued: result.queued, delivery: result.delivery },
          { headers: { "cache-control": "no-store" } }
        );
      }
      default:
        return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
    }
    return NextResponse.json({ view }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    const { status, body: err } = weErrorBody(e);
    return NextResponse.json(err, { status });
  }
}
