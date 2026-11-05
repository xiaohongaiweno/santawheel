"use client";

import { useState } from "react";

const MAX_LEN = 1000;

interface IncomingQuestion {
  id: string;
  question_text: string;
}

/**
 * The receiver's anonymous inbox: questions from the person drawing them,
 * each with its own answer box. The asker is never shown.
 */
export default function AnswerQuestions({
  token,
  questions,
}: {
  token: string;
  questions: IncomingQuestion[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [state, setState] = useState<Record<string, "sending" | "sent" | "error">>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function send(q: IncomingQuestion) {
    const answer = (answers[q.id] ?? "").trim();
    if (!answer) return;
    setState((s) => ({ ...s, [q.id]: "sending" }));
    try {
      const res = await fetch("/api/questions/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, questionId: q.id, answer }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErrors((e) => ({ ...e, [q.id]: data.error ?? "Could not send. Try again." }));
        setState((s) => ({ ...s, [q.id]: "error" }));
        return;
      }
      setState((s) => ({ ...s, [q.id]: "sent" }));
    } catch {
      setErrors((e) => ({ ...e, [q.id]: "Network error — try again." }));
      setState((s) => ({ ...s, [q.id]: "error" }));
    }
  }

  if (questions.length === 0) return null;

  return (
    <div className="mt-8 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-semibold">
        Anonymous question{questions.length === 1 ? "" : "s"} for you
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        The person drawing you is asking — anonymously. Your answer is sent
        back without revealing who you are either.
      </p>
      <div className="mt-3 space-y-4">
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg border border-border bg-background p-3">
            <p className="text-sm italic leading-relaxed">
              &ldquo;{q.question_text}&rdquo;
            </p>
            {state[q.id] === "sent" ? (
              <p className="mt-2 text-xs text-accent-green">
                Answered — they&apos;ll see it shortly.
              </p>
            ) : (
              <>
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      [q.id]: e.target.value.slice(0, MAX_LEN),
                    }))
                  }
                  rows={2}
                  maxLength={MAX_LEN}
                  placeholder="Your answer…"
                  className="mt-2 w-full rounded-lg border border-border bg-background p-2.5 text-sm outline-none focus:border-accent"
                />
                <div className="mt-2 flex items-center justify-between">
                  {errors[q.id] ? (
                    <span className="text-xs text-accent">{errors[q.id]}</span>
                  ) : (
                    <span className="text-xs text-muted">{(answers[q.id] ?? "").length}/{MAX_LEN}</span>
                  )}
                  <button
                    onClick={() => send(q)}
                    disabled={state[q.id] === "sending" || !(answers[q.id] ?? "").trim()}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {state[q.id] === "sending" ? "Sending…" : "Send answer"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
