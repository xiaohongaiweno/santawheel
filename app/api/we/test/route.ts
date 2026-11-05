import { NextRequest, NextResponse } from "next/server";
import { createWhiteElephantGame } from "@/lib/supabase/we-flow";
import { checkCreateRateLimit, clientIp } from "@/lib/rate-limit";
import { signToken } from "@/lib/tokens";
import { weErrorBody } from "@/lib/we-token";

/**
 * Internal harness for /white-elephant-test only. Creates a throwaway white
 * elephant game (names + gift pool, no emails sent yet) and returns the shared
 * board link so the rules can be walked through on one phone.
 *
 * Protected the same way anonymous creation is: a per-IP window limit. The
 * page is noindex/nofollow and linked from nowhere.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limit = await checkCreateRateLimit(ip, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many test games from this IP — try again later." },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec ?? 3600) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const names = Array.isArray(body.names) ? (body.names as unknown[]) : null;
  const gifts = Array.isArray(body.gifts) ? (body.gifts as unknown[]) : [];
  if (!names || names.length === 0) {
    return NextResponse.json({ error: "Add at least one participant." }, { status: 400 });
  }

  const participants = names
    .map((raw) => {
      if (typeof raw === "string") return { name: raw, email: "" };
      const row = raw as { name?: unknown; email?: unknown };
      return {
        name: String(row.name ?? ""),
        email: typeof row.email === "string" ? row.email : "",
      };
    })
    .filter((p) => p.name.trim().length > 0);

  try {
    const created = await createWhiteElephantGame({
      title: typeof body.title === "string" && body.title.trim() ? body.title : "White elephant test",
      organizerEmail: typeof body.organizerEmail === "string" ? body.organizerEmail : null,
      participants,
      gifts: gifts.filter((g): g is string => typeof g === "string"),
      stealLimit:
        typeof body.stealLimit === "number" || typeof body.stealLimit === "string"
          ? Number(body.stealLimit)
          : undefined,
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
