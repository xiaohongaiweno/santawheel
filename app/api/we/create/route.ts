import { NextRequest, NextResponse } from "next/server";
import { createWhiteElephantGame } from "@/lib/supabase/we-flow";
import { checkCreateRateLimit, clientIp } from "@/lib/rate-limit";
import { signToken } from "@/lib/tokens";
import { weErrorBody } from "@/lib/we-token";

/**
 * POST /api/we/create — public entry point for the white elephant play mode.
 *
 * Body: { title?, participants: (string | {name,email})[], gifts?: string[],
 *         stealLimit?: number }
 *
 * Returns the shared board link. That link is the only handle on the game: it
 * starts the draw, reorders players, sets the steal limit, undoes a misclick
 * and (optionally) emails the results, so there is no separate organizer token.
 *
 * Guarded by the same per-IP window as the anonymous Secret Santa create: a
 * game is a database row, so abuse costs us storage, not just bandwidth.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await checkCreateRateLimit(ip, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many games from this connection — try again in a little while." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec ?? 3600) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawNames = Array.isArray(body.participants)
    ? body.participants
    : Array.isArray(body.names)
      ? body.names
      : null;
  if (!rawNames || rawNames.length === 0) {
    return NextResponse.json({ error: "Add at least one participant." }, { status: 400 });
  }

  const participants = rawNames
    .map((raw) => {
      if (typeof raw === "string") return { name: raw.slice(0, 80), email: "" };
      const row = raw as { name?: unknown; email?: unknown };
      return {
        name: String(row.name ?? "").slice(0, 80),
        email: typeof row.email === "string" ? row.email.slice(0, 160) : "",
      };
    })
    .filter((p) => p.name.trim().length > 0);

  const gifts = Array.isArray(body.gifts)
    ? (body.gifts as unknown[])
        .filter((g): g is string => typeof g === "string")
        .map((g) => g.slice(0, 120))
        .filter((g) => g.trim().length > 0)
    : [];

  const rawLimit = body.stealLimit;
  const stealLimit =
    typeof rawLimit === "number" || typeof rawLimit === "string" ? Number(rawLimit) : undefined;

  try {
    const created = await createWhiteElephantGame({
      title:
        typeof body.title === "string" && body.title.trim()
          ? body.title.trim().slice(0, 120)
          : "White elephant",
      organizerEmail: typeof body.organizerEmail === "string" ? body.organizerEmail : null,
      participants,
      gifts,
      stealLimit,
      createdByIp: ip,
    });

    const token = signToken({ t: "w", x: created.exchangeId });
    return NextResponse.json({
      exchangeId: created.exchangeId,
      gameId: created.gameId,
      boardPath: `/we/${token}`,
      turnOrder: created.turnOrder,
    });
  } catch (e) {
    const { status, body: err } = weErrorBody(e);
    return NextResponse.json(err, { status });
  }
}
