"use client";

import { useState } from "react";

const MAX_LEN = 500;

/**
 * Anonymous question form: the gifter asks the person they are drawing
 * without revealing themselves. Answers arrive back on this same page.
 */
export default function AskQuestionForm({ token }: { token: string }) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/questions/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, question: text }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send. Try again.");
        setState("error");
        return;
      }
      setText("");
      setState("sent");
    } catch {
      setError("Network error — try again.");
      setState("error");
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Ask an anonymous question</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Wondering what they&apos;d like, their sizes, or where to send the gift?
        Ask — they only see the question, never you.
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value.slice(0, MAX_LEN));
          if (state === "sent" || state === "error") setState("idle");
        }}
        rows={3}
        maxLength={MAX_LEN}
        placeholder="e.g. What's your favourite snack, and do you have any allergies?"
        className="mt-3 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          {text.length}/{MAX_LEN}
        </span>
        <button
          onClick={send}
          disabled={state === "sending" || text.trim().length === 0}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {state === "sending" ? "Sending…" : "Send anonymously"}
        </button>
      </div>
      {state === "sent" && (
        <p className="mt-2 text-xs text-accent-green">
          Sent — you&apos;ll see the answer below (and by email) once they reply.
        </p>
      )}
      {state === "error" && error && (
        <p className="mt-2 text-xs text-accent">{error}</p>
      )}
    </div>
  );
}
