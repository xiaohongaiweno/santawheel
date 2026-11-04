"use client";

import { useState } from "react";

/**
 * Self-serve join form on /j/[token]. Works for email mode (name + email)
 * and link mode (name only). On success the page swaps to a confirmation.
 */
export default function JoinForm({
  token,
  emailMode,
}: {
  token: string;
  emailMode: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [joined, setJoined] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    state === "idle" &&
    name.trim().length > 0 &&
    (!emailMode || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));

  async function join() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), email: email.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        joined?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not join — try again.");
        setState("idle");
        return;
      }
      setJoined(data.joined ?? null);
      setState("done");
    } catch {
      setError("Network error — try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="mt-6 rounded-xl border border-accent-green/30 bg-accent-green/5 p-6 text-center">
        <p className="text-lg font-semibold text-accent-green">You&apos;re in! 🎁</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {joined != null ? `You are participant #${joined}. ` : ""}
          {emailMode
            ? "When the organizer draws the names, your assignment arrives by email."
            : "The organizer will hand you your private assignment link after drawing the names."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <label className="block text-sm font-medium" htmlFor="join-name">
        Your name
      </label>
      <input
        id="join-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder="e.g. Alex"
        className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
      />
      {emailMode && (
        <>
          <label className="mt-4 block text-sm font-medium" htmlFor="join-email">
            Your email
          </label>
          <input
            id="join-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1.5 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
          />
          <p className="mt-1.5 text-xs text-muted">
            Your assignment email is sent here after the draw. You can remove
            yourself at any time with a one-click link.
          </p>
        </>
      )}
      {error && <p className="mt-3 text-sm text-accent">{error}</p>}
      <button
        onClick={join}
        disabled={!canSubmit}
        className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {state === "saving" ? "Joining…" : "Join the draw"}
      </button>
    </div>
  );
}
