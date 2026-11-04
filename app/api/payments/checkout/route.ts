import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { createPremiumCheckout, paymentsMode } from "@/lib/payments/waffo";

/**
 * POST /api/payments/checkout  { token }  (organizer token)
 * Creates a Waffo hosted checkout session for the one-time $4.99 unlock.
 * The exchange is NOT marked paid here — fulfillment happens only when the
 * signature-verified webhook arrives.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string };
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
    .select("paid, organizer_email")
    .eq("id", payload.x)
    .maybeSingle();
  if (!exchange) return NextResponse.json({ error: "Exchange not found" }, { status: 404 });
  if (exchange.paid) {
    return NextResponse.json({ error: "This exchange is already premium" }, { status: 400 });
  }

  try {
    const session = await createPremiumCheckout({
      exchangeId: payload.x,
      organizerToken: body.token!,
      buyerEmail: exchange.organizer_email as string,
    });
    return NextResponse.json({
      checkoutUrl: session.checkoutUrl,
      mode: paymentsMode(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Checkout failed" },
      { status: 502 }
    );
  }
}
