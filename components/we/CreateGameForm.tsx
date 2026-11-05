"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const FIELD =
  "mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-base outline-none focus:border-accent";

/**
 * Public create form for the white elephant play mode. Parses the roster one
 * person per line, optionally "Name, email"; the gift pool is optional and
 * falls back to "Gift 1…N" so a host can start without typing labels.
 */
export default function CreateGameForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [people, setPeople] = useState("");
  const [gifts, setGifts] = useState("");
  const [stealLimit, setStealLimit] = useState("3");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);

    const participants = people
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const comma = line.indexOf(",");
        if (comma < 0) return { name: line, email: "" };
        return { name: line.slice(0, comma).trim(), email: line.slice(comma + 1).trim() };
      });

    if (participants.length === 0) {
      setError("Add at least one person to the list.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/we/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          participants,
          gifts: gifts
            .split("\n")
            .map((g) => g.trim())
            .filter(Boolean),
          stealLimit: Number(stealLimit),
        }),
      });
      const data = (await res.json()) as { boardPath?: string; error?: string };
      if (!res.ok || !data.boardPath) {
        setError(data.error ?? "Could not set up the game — try again.");
        return;
      }
      router.push(data.boardPath);
    } catch {
      setError("Network problem — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void create();
      }}
    >
      <label className="block text-sm font-medium">
        What are you calling it?
        <span className="ml-1 font-normal text-muted">optional</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Office swap 2026"
          maxLength={120}
          className={FIELD}
        />
      </label>

      <label className="block text-sm font-medium">
        Who is playing?
        <span className="ml-1 font-normal text-muted">one per line</span>
        <textarea
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          rows={6}
          placeholder={"Ada\nBen\nCleo, cleo@example.com"}
          className={`${FIELD} font-mono text-sm leading-relaxed`}
        />
      </label>
      <p className="-mt-2 text-xs text-muted">
        Emails are optional — add <span className="font-mono">, email</span> after a name
        and that person gets their result by email at the end.
      </p>

      <label className="block text-sm font-medium">
        What is in the pile?
        <span className="ml-1 font-normal text-muted">optional</span>
        <textarea
          value={gifts}
          onChange={(e) => setGifts(e.target.value)}
          rows={4}
          placeholder={"Blue box\nRed box\nGreen box"}
          className={`${FIELD} font-mono text-sm leading-relaxed`}
        />
      </label>
      <p className="-mt-2 text-xs text-muted">
        One label per gift — leave it empty and they become Gift 1, Gift 2, and so
        on. You need at least one gift per player.
      </p>

      <label className="block text-sm font-medium">
        How many times can one gift be stolen?
        <input
          type="number"
          min={0}
          max={10}
          value={stealLimit}
          onChange={(e) => setStealLimit(e.target.value)}
          className={`${FIELD} w-28`}
        />
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 h-12 w-full rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong disabled:opacity-60 sm:w-auto"
      >
        {busy ? "Setting up…" : "Create the board"}
      </button>

      <p className="text-xs leading-relaxed text-muted">
        You get one board link. Keep it — it runs the game, and it is how
        everyone else watches. Nothing is emailed until you press “Send result
        emails” at the end.
      </p>
    </form>
  );
}
