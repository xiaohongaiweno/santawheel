"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Exclusions editor for collect-first exchanges (draft state only).
 * Same one-pair-per-line format as the creation form; saving replaces all
 * exclusions for the draw.
 */
export default function ExclusionsEditor({
  token,
  initialText,
  hint,
}: {
  token: string;
  initialText: string;
  hint: string;
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/manage/exclusions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, exclusionsText: text }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save.");
        setState("error");
        return;
      }
      setState("saved");
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setState("error");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Exclusions — who shouldn&apos;t draw whom</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (state !== "idle") setState("idle");
        }}
        rows={4}
        placeholder={"Anna - Ben\nanna@example.com - carl@example.com"}
        className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">One pair per line. Saving replaces all exclusions.</span>
        <button
          onClick={save}
          disabled={state === "saving"}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {state === "saving" ? "Saving…" : "Save exclusions"}
        </button>
      </div>
      {state === "saved" && (
        <p className="mt-2 text-xs text-accent-green">Exclusions saved.</p>
      )}
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
    </div>
  );
}
