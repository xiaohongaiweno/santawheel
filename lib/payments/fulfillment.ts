import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import { paymentsMode } from "@/lib/payments/waffo";

export interface OrderCompletedData {
  orderId: string;
  orderMetadata?: Record<string, string> | null;
  orderMerchantExternalId?: string | null;
  mode?: string;
  chargedAmount?: string;
  currency?: string;
}

/**
 * Server-side fulfillment for a verified `order.completed` event.
 * Never trust client-side payment state: this is the only place an exchange
 * becomes paid, and only from a signature-verified webhook.
 *
 * Idempotent: replayed events and already-paid exchanges are no-ops.
 * Returns the updated state for observability.
 */
export async function fulfillOrderCompleted(
  data: OrderCompletedData
): Promise<{ marked: boolean; reason?: string; exchangeId?: string }> {
  const exchangeId = data.orderMetadata?.exchangeId;
  if (!exchangeId) return { marked: false, reason: "missing exchangeId in orderMetadata" };
  if (data.orderMetadata?.product !== "santawheel-premium") {
    return { marked: false, reason: "unexpected product metadata" };
  }
  // A test-mode webhook must never unlock anything in prod mode (and vice versa).
  if (data.mode && data.mode !== paymentsMode()) {
    return { marked: false, reason: `mode mismatch: event=${data.mode} app=${paymentsMode()}` };
  }

  const db = getSupabaseAdmin();
  const now = new Date().toISOString();
  const reminderAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { data: updated, error } = await db
    .from("exchange")
    .update({
      paid: true,
      paid_at: now,
      payment_ref: data.orderId,
      payment_mode: data.mode ?? paymentsMode(),
      reminder_at: reminderAt,
    })
    .eq("id", exchangeId)
    .eq("paid", false) // idempotency guard: only first fulfillment wins
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`fulfillOrderCompleted failed: ${error.message}`);
  if (!updated) {
    return { marked: false, reason: "already paid or unknown exchange", exchangeId };
  }
  return { marked: true, exchangeId };
}
