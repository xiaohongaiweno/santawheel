import { WaffoPancake } from "@waffo/pancake-ts";
import { baseUrl } from "@/lib/email-templates";

export const PREMIUM_PRICE = "4.99";
export const PREMIUM_CURRENCY = "USD";
export const PREMIUM_PRODUCT_TAG = "santawheel-premium";

/**
 * Test-mode switch: PAYMENTS_MODE=test (default) uses the *_TEST credentials
 * (Waffo test API key + test product — card 4576 7500 0000 0110, no real
 * money). PAYMENTS_MODE=prod uses the production key. Webhook events carry a
 * `mode` field and are only honored when it matches this setting.
 */
export function paymentsMode(): "test" | "prod" {
  return process.env.PAYMENTS_MODE === "prod" ? "prod" : "test";
}

let client: WaffoPancake | null = null;

/**
 * Normalize the private key into PEM. Accepts:
 * - PEM with escaped newlines ("-----BEGIN...-----\nMII...") — .env style
 * - PEM with real newlines
 * - raw base64 body (as copied from some dashboards) — gets PEM-wrapped
 */
function normalizePrivateKey(raw: string): string {
  const key = raw.trim().replace(/\\n/g, "\n");
  if (key.startsWith("-----BEGIN")) return key;
  return `-----BEGIN PRIVATE KEY-----\n${key}\n-----END PRIVATE KEY-----`;
}

function credentials(): { merchantId: string; privateKey: string } {
  const test = paymentsMode() === "test";
  const merchantId = test
    ? process.env.WAFFO_MERCHANT_ID_TEST
    : process.env.WAFFO_MERCHANT_ID;
  const privateKey = test
    ? process.env.WAFFO_PRIVATE_KEY_TEST
    : process.env.WAFFO_PRIVATE_KEY;
  if (!merchantId || !privateKey) {
    throw new Error(
      `Waffo credentials missing for ${paymentsMode()} mode — set WAFFO_MERCHANT_ID${
        test ? "_TEST" : ""
      } / WAFFO_PRIVATE_KEY${test ? "_TEST" : ""}`
    );
  }
  return { merchantId, privateKey: normalizePrivateKey(privateKey) };
}

function getWaffo(): WaffoPancake {
  if (client) return client;
  const { merchantId, privateKey } = credentials();
  client = new WaffoPancake({ merchantId, privateKey });
  return client;
}

export function premiumProductId(): string {
  const id =
    paymentsMode() === "test"
      ? process.env.WAFFO_PRODUCT_ID_TEST
      : process.env.WAFFO_PRODUCT_ID;
  if (!id) throw new Error("WAFFO_PRODUCT_ID is not configured");
  return id;
}

/**
 * Create a hosted checkout session for the one-time $4.99 unlock.
 * The exchange id travels in signed-gateway metadata; fulfillment happens
 * exclusively in the webhook handler, never from client input.
 */
export async function createPremiumCheckout(params: {
  exchangeId: string;
  organizerToken: string;
  buyerEmail: string;
}): Promise<{ checkoutUrl: string; sessionId: string }> {
  const session = await getWaffo().checkout.createSession({
    productId: premiumProductId(),
    currency: PREMIUM_CURRENCY,
    buyerEmail: params.buyerEmail,
    successUrl: `${baseUrl()}/manage/${params.organizerToken}?paid=1`,
    metadata: {
      product: PREMIUM_PRODUCT_TAG,
      exchangeId: params.exchangeId,
    },
    orderMerchantExternalId: `santawheel-${params.exchangeId}`.slice(0, 128),
    language: "en",
  });
  return { checkoutUrl: session.checkoutUrl, sessionId: session.sessionId };
}
