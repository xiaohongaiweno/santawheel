"use client";

import { useMemo, useState } from "react";
import { buildDraw, type DrawPair } from "@/lib/draw/derangement";

function parseNames(text: string): string[] {
  return [
    ...new Set(
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    ),
  ];
}

export default function DrawForm() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DrawPair[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const names = useMemo(() => parseNames(text), [text]);

  function generate() {
    setError(null);
    if (names.length < 2) {
      setResult(null);
      setError("Enter at least 2 names, one per line.");
      return;
    }
    try {
      setResult(buildDraw(names));
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Could not draw names.");
    }
  }

  return (
    <div id="generate" className="w-full">
      <label
        htmlFor="participants"
        className="mb-2 block text-left text-sm font-medium"
      >
        Paste your participants list
      </label>
      <textarea
        id="participants"
        name="participants"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"One name per line:\nAlice\nBob\nCarol\nDave"}
        spellCheck={false}
        className="block w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base leading-relaxed outline-none focus:border-accent"
      />
      <p className="mt-1.5 text-left text-xs text-muted" aria-live="polite">
        {names.length} participant{names.length === 1 ? "" : "s"} · one name per line
      </p>

      <button
        type="button"
        onClick={generate}
        className="mt-3 h-12 w-full rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong sm:w-auto"
      >
        Generate
      </button>

      {error && (
        <p role="alert" className="mt-3 text-left text-sm text-accent">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 w-full rounded-lg border border-border bg-surface p-4 text-left">
          <h2 className="text-sm font-semibold">The draw</h2>
          <ol className="mt-2 space-y-1 text-sm">
            {result.map((p) => (
              <li key={`${p.giver}->${p.receiver}`}>
                <span className="font-medium">{p.giver}</span> draws{" "}
                <span className="font-medium">{p.receiver}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted">
            Drawn in your browser. Automatic email delivery of assignments is
            coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
