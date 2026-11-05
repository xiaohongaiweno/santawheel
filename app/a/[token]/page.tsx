import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import RemoveMeButton from "@/components/delivery/RemoveMeButton";
import RevealCard from "@/components/delivery/RevealCard";
import WishlistEditor from "@/components/delivery/WishlistEditor";
import AddressEditor from "@/components/delivery/AddressEditor";
import AskQuestionForm from "@/components/delivery/AskQuestionForm";
import AnswerQuestions from "@/components/delivery/AnswerQuestions";
import { signToken } from "@/lib/tokens";
import { kindLabel, budgetLabel, deadlineLabel } from "@/lib/email-templates";

export const metadata = {
  title: "Your assignment",
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

export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyToken(token);

  if (!payload || payload.t !== "a") {
    return (
      <Notice
        title="This link is not valid"
        body="Check that you opened the full link from your email — it may have been truncated or mistyped."
      />
    );
  }

  const db = getSupabaseAdmin();
  const { data: exchange } = await db
    .from("exchange")
    .select("title, status, draw_generation, kind, budget_amount, deadline")
    .eq("id", payload.x)
    .maybeSingle();

  if (!exchange) {
    return <Notice title="Draw not found" body="This draw no longer exists." />;
  }
  if (exchange.status !== "drawn" || payload.g !== exchange.draw_generation) {
    return (
      <Notice
        title="This link has been revoked"
        body="The organizer reset the draw and all links were re-issued. Ask them to resend your new assignment email."
      />
    );
  }

  const { data: pair } = await db
    .from("pair")
    .select("receiver_id")
    .eq("exchange_id", payload.x)
    .eq("giver_id", payload.p)
    .maybeSingle();
  if (!pair) {
    return (
      <Notice
        title="This link has been revoked"
        body="The draw was reset. Ask the organizer to resend your assignment email."
      />
    );
  }

  const [{ data: receiver }, { data: giver }] = await Promise.all([
    db
      .from("participant")
      .select("name, wishlist_url, wishlist_text, address_text, removed_at")
      .eq("id", pair.receiver_id)
      .single(),
    db
      .from("participant")
      .select("name, wishlist_text, address_text, removed_at")
      .eq("id", payload.p)
      .single(),
  ]);

  if (giver?.removed_at) {
    return (
      <Notice
        title="You have been removed from this draw"
        body="Your data was removed at your request. No further emails will be sent to you."
      />
    );
  }

  const receiverRemoved = Boolean(receiver?.removed_at);
  const receiverName = receiverRemoved ? "a removed participant" : (receiver?.name as string);

  const budget = budgetLabel(exchange.budget_amount);
  const deadline = deadlineLabel(exchange.deadline);
  const wishlistIdeas = String(receiver?.wishlist_text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // Anonymous Q&A: questions this gifter asked (with any answers) and
  // questions waiting for them as a receiver. Never loaded for removed
  // participants, and names are never attached in either direction.
  const [askedResult, inboxResult] = await Promise.all([
    db
      .from("question")
      .select("id, question_text, answer_text, created_at")
      .eq("exchange_id", payload.x)
      .eq("question_from", payload.p)
      .order("created_at"),
    db
      .from("question")
      .select("id, question_text")
      .eq("exchange_id", payload.x)
      .eq("receiver_id", payload.p)
      .is("answer_text", null)
      .order("created_at"),
  ]);
  const asked = (askedResult.data ?? []) as Array<{
    id: string;
    question_text: string;
    answer_text: string | null;
  }>;
  const inbox = (inboxResult.data ?? []) as Array<{
    id: string;
    question_text: string;
  }>;

  // Track first open (drives premium reminder emails). Idempotent.
  // PostgREST needs `is.null` for NULL comparison — `eq(col, null)` produces
  // `eq.null`, which Postgres rejects as an invalid timestamp literal.
  await db
    .from("assignment")
    .update({ viewed_at: new Date().toISOString() })
    .eq("exchange_id", payload.x)
    .eq("giver_id", payload.p)
    .is("viewed_at", null);

  return (
    <section className="mx-auto max-w-md px-4 py-14">
      <p className="text-sm text-muted">{String(exchange.title)}</p>
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
        Hi {giver?.name}, you are drawing for
      </h1>
      <RevealCard>
        <div className="mt-6 rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-3xl font-bold text-accent">{receiverName}</p>
          {receiverRemoved && (
            <p className="mt-2 text-xs text-muted">
              This person removed their data. The organizer has been handling it —
              they may update the draw.
            </p>
          )}
          {wishlistIdeas.length > 0 && !receiverRemoved && (
            <div className="mt-4 border-t border-border pt-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Their wishlist
              </p>
              <ul className="mt-2 space-y-1.5">
                {wishlistIdeas.map((idea, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    <span className="mr-1.5 text-accent">·</span>
                    {idea}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {receiver?.address_text && !receiverRemoved && (
            <div className="mt-4 border-t border-border pt-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Their shipping address
              </p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed">
                {String(receiver.address_text)}
              </p>
            </div>
          )}
          {receiver?.wishlist_url && !receiverRemoved && (
            <a
              href={receiver.wishlist_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
            >
              View their wishlist
            </a>
          )}
        </div>
      </RevealCard>

      {!giver?.removed_at && (
        <WishlistEditor
          token={token}
          initialText={String(giver?.wishlist_text ?? "")}
        />
      )}

      {!giver?.removed_at && (
        <AddressEditor
          token={token}
          initialText={String(giver?.address_text ?? "")}
        />
      )}

      {!giver?.removed_at && !receiverRemoved && (
        <AskQuestionForm token={token} />
      )}

      {asked.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm font-semibold">
            Your question{asked.length === 1 ? "" : "s"}
          </p>
          <div className="mt-3 space-y-3">
            {asked.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <p className="text-sm italic leading-relaxed">
                  &ldquo;{q.question_text}&rdquo;
                </p>
                {q.answer_text ? (
                  <p className="mt-2 border-l-2 border-accent pl-3 text-sm leading-relaxed">
                    {q.answer_text}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    Waiting for an answer — you&apos;ll get an email when they reply.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!giver?.removed_at && (
        <AnswerQuestions token={token} questions={inbox} />
      )}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Keep this page private — it is your personal assignment link and shows
        nobody else&apos;s pairing.
      </p>

      <div className="mt-8 rounded-lg border border-border bg-surface p-4">
        <p className="text-xs leading-relaxed text-muted">
          This link was sent because you joined a {kindLabel(String(exchange.kind))}{" "}
          organized with SantaWheel. Don&apos;t want to take part?
        </p>
        <div className="mt-3">
          <RemoveMeButton
            removeToken={signToken({ t: "r", x: payload.x, p: payload.p })}
          />
        </div>
      </div>
    </section>
  );
}
