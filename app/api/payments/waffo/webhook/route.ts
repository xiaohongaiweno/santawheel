import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@waffo/pancake-ts";
import { fulfillOrderCompleted, type OrderCompletedData } from "@/lib/payments/fulfillment";

/**
 * Waffo webhook receiver. Registered in the Waffo dashboard as
 * https://santawheel.com/api/payments/waffo/webhook (Raw payload format).
 *
 * The signature covers the raw body; verification is server-side only — this
 * endpoint is the sole path that marks an exchange as paid.
 * Always 200 quickly for validly signed events (Waffo retries on non-2xx).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-waffo-signature");

  let event: { eventType?: string; id?: string; mode?: string; data?: OrderCompletedData };
  try {
    event = verifyWebhook(raw, signature) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.eventType === "order.completed") {
    try {
      // `mode` lives at the event level; Waffo may also echo it in the order
      // payload. Thread it through so the test/prod guard can actually fire.
      const result = await fulfillOrderCompleted({
        ...(event.data ?? ({} as OrderCompletedData)),
        mode: event.data?.mode ?? event.mode,
      });
      // 200 either way: idempotent replays are expected, not errors.
      return NextResponse.json({ ok: true, ...result });
    } catch (e) {
      // Let Waffo retry on internal errors.
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Fulfillment failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true, ignored: event.eventType });
}
