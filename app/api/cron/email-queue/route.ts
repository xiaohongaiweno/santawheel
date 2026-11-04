import { NextRequest, NextResponse } from "next/server";
import { processDueJobs, sweepReminders } from "@/lib/email-queue";

/**
 * Email retry worker. Vercel Cron hits this every 5 minutes (see vercel.json)
 * and processes due jobs: pending jobs whose backoff window has elapsed, plus
 * the premium reminder sweep for paid exchanges whose reminder time arrived.
 * Protect with CRON_SECRET (Vercel sends "Authorization: Bearer <CRON_SECRET>").
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await processDueJobs({ limit: 50 });
    const reminders = await sweepReminders().catch((e) => ({
      error: e instanceof Error ? e.message : "reminder sweep failed",
    }));
    return NextResponse.json({ ok: true, ...result, reminders });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Queue processing failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
