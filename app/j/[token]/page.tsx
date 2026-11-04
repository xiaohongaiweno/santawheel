import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import JoinForm from "@/components/delivery/JoinForm";
import { budgetLabel, deadlineLabel, kindLabel } from "@/lib/email-templates";

export const metadata = {
  title: "Join the draw",
  robots: { index: false, follow: false },
};

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <section className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
    </section>
  );
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyToken(token);

  if (!payload || payload.t !== "j") {
    return (
      <Notice
        title="This join link is not valid"
        body="Check that you opened the full link — it may have been truncated or mistyped."
      />
    );
  }

  const db = getSupabaseAdmin();
  const { data: exchange } = await db
    .from("exchange")
    .select("title, status, kind, delivery_mode, budget_amount, deadline, draw_generation")
    .eq("id", payload.x)
    .maybeSingle();

  if (!exchange) {
    return <Notice title="Draw not found" body="This draw no longer exists." />;
  }

  if (exchange.status !== "draft") {
    return (
      <Notice
        title="The names have already been drawn"
        body="Joining is closed. Ask the organizer to send you your assignment."
      />
    );
  }

  const { count } = await db
    .from("participant")
    .select("id", { count: "exact", head: true })
    .eq("exchange_id", payload.x)
    .is("removed_at", null);

  const emailMode = exchange.delivery_mode !== "link";
  const budget = budgetLabel(exchange.budget_amount);
  const deadline = deadlineLabel(exchange.deadline);

  return (
    <section className="mx-auto max-w-md px-4 py-14">
      <p className="text-sm text-muted">
        {kindLabel(String(exchange.kind))} · {String(exchange.title)}
      </p>
      {(budget || deadline) && (
        <p className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
          {budget && (
            <span className="rounded-full bg-surface px-2.5 py-1 ring-1 ring-border">
              Budget {budget}
            </span>
          )}
          {deadline && (
            <span className="rounded-full bg-surface px-2.5 py-1 ring-1 ring-border">
              Exchange day {deadline}
            </span>
          )}
        </p>
      )}
      <h1 className="mt-2 text-2xl font-bold tracking-tight">
        Join the draw
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {count} {count === 1 ? "person has" : "people have"} joined so far.
        {emailMode
          ? " You'll get your assignment by email once the organizer draws the names."
          : " The organizer hands out one private link per person after drawing."}
      </p>
      <JoinForm token={token} emailMode={emailMode} />
    </section>
  );
}
