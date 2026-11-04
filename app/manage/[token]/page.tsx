import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import {
  ResendButton,
  RedrawButton,
  DeleteExchangeButton,
} from "@/components/delivery/ManageButtons";
import AssignmentLinks from "@/components/delivery/AssignmentLinks";
import PayButton from "@/components/delivery/PayButton";
import ImportPanel from "@/components/delivery/ImportPanel";
import { assignmentUrl } from "@/lib/email-templates";
import { exchangePolicy } from "@/lib/exchange-visibility";
import { paymentsMode, PREMIUM_PRICE } from "@/lib/payments/waffo";

export const metadata = {
  title: "Organizer dashboard",
  robots: { index: false, follow: false },
};

type Participant = {
  id: string;
  name: string;
  email: string | null;
  removed_at: string | null;
};
type Assignment = {
  giver_id: string;
  email_status: "pending" | "sent" | "failed" | "cancelled";
  attempts: number;
  last_error: string | null;
  sent_at: string | null;
};
type Pair = { giver_id: string; receiver_id: string };
type EmailJob = {
  id: string;
  kind: string;
  to_email: string;
  status: string;
  attempts: number;
  last_error: string | null;
};

const statusStyle: Record<string, string> = {
  sent: "bg-accent-green/10 text-accent-green",
  pending: "bg-border/50 text-muted",
  failed: "bg-accent/10 text-accent",
  cancelled: "bg-border/50 text-muted",
};

export default async function ManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyToken(token);

  if (!payload || payload.t !== "o") {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">This organizer link is not valid</h1>
        <p className="mt-3 text-sm text-muted">
          Use the exact link from your &quot;Your SantaWheel draw is ready&quot;
          email. If you lost it, contact support and we can re-issue it to the
          organizer&apos;s email address.
        </p>
      </section>
    );
  }

  const db = getSupabaseAdmin();
  const { data: exchange } = await db
    .from("exchange")
    .select("*")
    .eq("id", payload.x)
    .maybeSingle();

  if (!exchange) {
    return (
      <section className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Draw not found</h1>
      </section>
    );
  }

  const policy = exchangePolicy(exchange);

  // Blind mode: the pairings are not merely hidden in the markup, they are
  // never loaded on this request at all.
  const [{ data: participants }, { data: assignments }, { data: jobs }, pairResult] =
    await Promise.all([
      db.from("participant").select("*").eq("exchange_id", payload.x).order("name"),
      policy.sendsEmail
        ? db
            .from("assignment")
            .select("giver_id, email_status, attempts, last_error, sent_at, viewed_at")
            .eq("exchange_id", payload.x)
        : Promise.resolve({ data: [] }),
      policy.sendsEmail
        ? db.from("email_job").select("*").eq("exchange_id", payload.x).order("created_at")
        : Promise.resolve({ data: [] }),
      policy.showPairings
        ? db.from("pair").select("giver_id, receiver_id").eq("exchange_id", payload.x)
        : Promise.resolve({ data: [] }),
    ]);

  const pairs = (pairResult.data ?? []) as unknown as Pair[];
  const participantList = (participants ?? []) as unknown as Participant[];
  const byId = new Map(participantList.map((p) => [p.id, p]));
  const assignmentByGiver = new Map(
    ((assignments ?? []) as unknown as Assignment[]).map((a) => [a.giver_id, a])
  );
  const receiverByGiver = new Map(
    pairs.map((p) => [p.giver_id, byId.get(p.receiver_id)])
  );
  const jobList = ((jobs ?? []) as unknown as EmailJob[]).filter((j) => j.status !== "sent");
  const organizerJob = ((jobs ?? []) as unknown as EmailJob[])
    .filter((j) => j.kind === "organizer_link")
    .pop();

  const delivered = [...assignmentByGiver.values()].filter(
    (a) => a.email_status === "sent"
  ).length;
  const active = participantList.filter((p) => !p.removed_at);

  const privateLinks =
    policy.showsPrivateLinks && exchange.status === "drawn"
      ? active.map((p) => ({
          name: p.name,
          url: assignmentUrl(payload.x, p.id, Number(exchange.draw_generation)),
        }))
      : [];

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Organizer dashboard · draw #{exchange.draw_generation}
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        {String(exchange.title)}
      </h1>
      <p className="mt-2 text-sm text-muted">
        Status: {String(exchange.status)} ·{" "}
        {policy.sendsEmail ? `${delivered}/${active.length} emails delivered` : `${active.length} participants`}{" "}
        · delivery: {policy.sendsEmail ? "email" : "private links"} · budget:{" "}
        {exchange.budget_amount ?? "—"} · deadline: {exchange.deadline ?? "—"}
      </p>

      {policy.blind && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-surface">
              Blind mode
            </span>
            <p className="text-sm font-medium">You cannot see who drew whom</p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            This draw was created in blind mode, so the pairings are never shown
            here and never exported — not even to you. You can still track
            delivery, resend an email, or reset the draw. Each participant sees
            only their own assignment; anyone who opens an individual
            participant&apos;s link can see that one assignment, which is true of
            every draw.
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {policy.canExportPairs && (
          <a
            href={`/api/manage/csv?token=${encodeURIComponent(token)}`}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
          >
            Download pairs CSV
          </a>
        )}
        <RedrawButton token={token} deliveryMode={policy.deliveryMode} />
      </div>

      {/* Premium */}
      {exchange.paid ? (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent-green/30 bg-accent-green/5 px-4 py-3">
            <span className="rounded-full bg-accent-green px-2.5 py-1 text-xs font-semibold text-white">
              Premium
            </span>
            <span className="text-xs text-muted">
              Paid {String(exchange.payment_mode ?? "")} · watermark removed ·
              no-repeat draws on
              {exchange.reminder_at && !exchange.reminder_sent
                ? ` · reminder scheduled for ${new Date(String(exchange.reminder_at)).toLocaleDateString("en-US")}`
                : exchange.reminder_sent
                  ? " · reminder sent"
                  : ""}
            </span>
          </div>
          {policy.sendsEmail && <ImportPanel token={token} />}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              SantaWheel Premium — ${PREMIUM_PRICE}{" "}
              <span className="text-sm font-normal text-muted">
                one-time, not a subscription
              </span>
            </h2>
            {paymentsMode() === "test" && (
              <span className="rounded-full bg-border/50 px-2.5 py-1 text-xs font-medium text-muted">
                Test mode — no real charge
              </span>
            )}
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            <li>· Remove the &quot;Made with SantaWheel&quot; watermark from everyone&apos;s result page</li>
            <li>· Import participants in bulk from Excel / CSV</li>
            <li>· Automatic reminder for anyone who hasn&apos;t opened their assignment (3 days after the draw)</li>
            <li>· No-repeat draws — pairs from your previous exchanges won&apos;t repeat</li>
          </ul>
          <div className="mt-4">
            <PayButton token={token} />
          </div>
          <p className="mt-2 text-xs text-muted">
            One-time payment via Waffo checkout. No account, no subscription —
            pay once, this exchange is premium forever.
          </p>
        </div>
      )}

      {policy.showsPrivateLinks ? (
        <>
          <h2 className="mt-10 text-lg font-semibold">Private links</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            This draw does not email anyone. Copy each link and send it to the
            right person.
          </p>
          <div className="mt-3">
            <AssignmentLinks links={privateLinks} />
          </div>
        </>
      ) : (
        <>
          {/* Delivery per participant */}
          <h2 className="mt-10 text-lg font-semibold">Delivery</h2>
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {active.map((p) => {
              const a = assignmentByGiver.get(p.id);
              const status = a?.email_status ?? "pending";
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {p.name}{" "}
                      <span className="font-normal text-muted">
                        {policy.showPairings
                          ? `draws ${receiverByGiver.get(p.id)?.name ?? "—"}`
                          : "assignment hidden"}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted">{p.email}</p>
                    {a?.last_error && (
                      <p className="mt-1 text-xs text-accent" title={a.last_error}>
                        {a.last_error}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[status] ?? statusStyle.pending}`}
                  >
                    {status}
                    {a && a.attempts > 0 ? ` (${a.attempts})` : ""}
                  </span>
                  <ResendButton token={token} giverId={p.id} />
                </div>
              );
            })}
          </div>

          {/* Organizer email delivery */}
          <h2 className="mt-10 text-lg font-semibold">Your dashboard email</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{String(exchange.organizer_email)}</p>
              {organizerJob?.last_error && (
                <p className="mt-1 text-xs text-accent">{organizerJob.last_error}</p>
              )}
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[organizerJob?.status ?? "sent"]}`}
            >
              {organizerJob?.status ?? "sent"}
              {organizerJob ? ` (${organizerJob.attempts})` : ""}
            </span>
            <ResendButton token={token} />
          </div>

          {/* Failed jobs with errors */}
          {jobList.length > 0 && (
            <>
              <h2 className="mt-10 text-lg font-semibold">Failed send attempts</h2>
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-accent/30 bg-surface">
                {jobList.map((j) => (
                  <div key={j.id} className="px-4 py-3">
                    <p className="text-sm font-medium">
                      {j.kind === "assignment" ? "Assignment" : "Dashboard"} email →{" "}
                      {j.to_email}
                    </p>
                    <p className="mt-1 text-xs text-accent">{j.last_error}</p>
                    <p className="mt-1 text-xs text-muted">
                      {j.attempts} attempt{j.attempts === 1 ? "" : "s"} · use
                      &quot;Resend&quot; above to try again
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <p className="mt-10 text-xs leading-relaxed text-muted">
        Resetting the draw revokes every assignment link already sent and{" "}
        {policy.sendsEmail
          ? "emails new ones. Removed participants are permanently deleted on reset."
          : "issues new private links. Removed participants are permanently deleted on reset."}
      </p>

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">Delete this draw</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Once the exchange is over, you can erase it. This removes every
          participant name and email address, the pairings, and the delivery
          history from our database — it is how you exercise the deletion right
          described in our privacy policy.
        </p>
        <div className="mt-3">
          <DeleteExchangeButton token={token} />
        </div>
      </div>
    </section>
  );
}
