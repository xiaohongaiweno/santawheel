import crypto from "node:crypto";

/**
 * Stateless signed tokens (HMAC-SHA256). No login system: access is granted
 * purely by possessing an unguessable signed link. Tokens never expire, but
 * assignment tokens embed the draw generation — resetting a draw revokes them.
 */

export type TokenPayload =
  | { t: "a"; x: string; p: string; g: number } // assignment: exchange + giver + generation
  | { t: "o"; x: string } // organizer manage link
  | { t: "j"; x: string } // join link: participants add themselves while the draw is collecting
  | { t: "r"; x: string; p: string } // remove-my-data link
  | { t: "q"; x: string; q: string } // question answer link: exchange + question id
  | { t: "w"; x: string }; // white elephant board link: exchange

function secret(): string {
  const s =
    process.env.APP_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) {
    throw new Error(
      "Missing APP_TOKEN_SECRET (or SUPABASE_SERVICE_ROLE_KEY) for token signing"
    );
  }
  return s;
}

export function signToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = crypto
    .createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8")
    ) as TokenPayload;
    if (
      !payload ||
      typeof payload !== "object" ||
      !("t" in payload) ||
      !("x" in payload) ||
      typeof payload.x !== "string"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
