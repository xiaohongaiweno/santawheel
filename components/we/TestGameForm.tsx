"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Internal harness form: builds a throwaway white elephant game and jumps to
 * its board. Parses one participant per line as "Name" or "Name, email".
 */
export default function TestGameForm() {
  const router = useRouter();
  const [title, setTitle] = useState("White elephant test");
  const [people, setPeople] = useState("Ada\nBen\nCleo");
  const [gifts, setGifts] = useState("Blue box\nRed box\nGreen box");
  const [stealLimit, setStealLimit] = useState("3");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);

    const names = people
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, email] = line.split(",");
        return { name: name.trim(), email: (email ?? "").trim() };
      });

    try {
      const res = await fetch("/api/we/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          names,
          gifts: gifts
            .split("\n")
            .map((g) => g.trim())
            .filter(Boolean),
          stealLimit: Number(stealLimit),
        }),
      });
      const data = (await res.json()) as { boardPath?: string; error?: string };
      if (!res.ok || !data.boardPath) {
        setError(data.error ?? "Could not create the test game.");
        return;
      }
      router.push(data.boardPath);
    } catch {
      setError("Network problem — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <label className="block text-sm font-medium">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-sm font-medium">
        Participants — one per line, optional <code>, email</code>
        <textarea
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
        />
      </label>

      <label className="block text-sm font-medium">
        Gifts — one per line (the pool)
        <textarea
          value={gifts}
          onChange={(e) => setGifts(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm"
        />
      </label>

      <label className="block text-sm font-medium">
        Steal limit per gift
        <input
          type="number"
          min={0}
          max={10}
          value={stealLimit}
          onChange={(e) => setStealLimit(e.target.value)}
          className="mt-1 w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void create()}
        disabled={busy}
        className="min-h-11 w-full rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-accent-strong disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create game and open the board"}
      </button>

      <p className="text-xs text-muted">
        Emails are optional: a participant without an address simply gets no result email. The game
        is created in link mode, so nothing is sent until you press “Send result emails” on the
        board.
      </p>
    </div>
  );
}
