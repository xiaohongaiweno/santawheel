import { verifyToken } from "@/lib/tokens";
import { WeGameError } from "@/lib/supabase/we-flow";

/**
 * A white elephant board link carries `{ t: "w", x: exchangeId }`: possession
 * of the link is the credential (same model as every other SantaWheel link).
 * Whoever holds it operates the board — that is the "one phone on the table"
 * flow, and spectators can watch on theirs.
 */
export function exchangeIdFromBoardToken(token: unknown): string | null {
  if (typeof token !== "string" || token.length === 0) return null;
  const payload = verifyToken(token);
  if (!payload || payload.t !== "w") return null;
  return payload.x;
}

export function weErrorBody(error: unknown): { status: number; body: { error: string; code?: string } } {
  if (error instanceof WeGameError) {
    return { status: error.status, body: { error: error.message, code: error.code } };
  }
  const message = error instanceof Error ? error.message : "White elephant request failed";
  return { status: 500, body: { error: message } };
}
