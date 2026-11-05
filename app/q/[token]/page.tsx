import { verifyToken } from "@/lib/tokens";
import { getSupabaseAdmin } from "@/lib/supabase/draw-service";
import AnswerQuestions from "@/components/delivery/AnswerQuestions";

export const metadata = {
  title: "Answer an anonymous question",
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

/**
 * Direct answer page for one anonymous question, reached from the "Answer
 * anonymously" email CTA. The token binds exchange + question id and never
 * reveals the asker. Answered questions land here with a done message.
 */
export default async function QuestionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const payload = verifyToken(token);

  if (!payload || payload.t !== "q") {
    return (
      <Notice
        title="This link is not valid"
        body="Open the full link from your email — it may have been truncated or mistyped."
      />
    );
  }

  const db = getSupabaseAdmin();
  const { data: question } = await db
    .from("question")
    .select("question_text, answer_text, answered_at")
    .eq("id", payload.q)
    .eq("exchange_id", payload.x)
    .maybeSingle();

  if (!question) {
    return (
      <Notice
        title="Question not found"
        body="This question no longer exists — the asker or the draw may have been removed."
      />
    );
  }

  if (question.answer_text) {
    return (
      <section className="mx-auto max-w-md px-4 py-14">
        <h1 className="text-xl font-bold">Already answered</h1>
        <div className="mt-5 rounded-xl border border-border bg-surface p-5 text-left">
          <p className="text-sm italic leading-relaxed text-muted">
            &ldquo;{String(question.question_text)}&rdquo;
          </p>
          <p className="mt-3 border-l-2 border-accent pl-3 text-sm leading-relaxed">
            {String(question.answer_text)}
          </p>
        </div>
        <p className="mt-4 text-xs text-muted">
          Your answer was delivered anonymously. Nothing more to do here.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-14">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Anonymous question
      </p>
      <h1 className="mt-1 text-xl font-bold tracking-tight">
        Someone needs a hint
      </h1>
      <AnswerQuestions
        token={token}
        questions={[{ id: payload.q, question_text: String(question.question_text) }]}
      />
      <p className="mt-6 text-xs leading-relaxed text-muted">
        Your answer goes back to your Secret Santa anonymously — they never see
        who asked or who answered.
      </p>
    </section>
  );
}
