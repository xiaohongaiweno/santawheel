"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Organizer action: draw the names of a collect-first (draft) exchange. */
export default function DrawNowButton({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "drawing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function draw() {
    setState("drawing");
    setError(null);
    try {
      const res = await fetch("/api/manage/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Draw failed — try again.");
        setState("error");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setState("error");
    }
  }

  return (
    <div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">
            Drawing locks the participant list — late joiners need a redraw.
          </span>
          <button
            onClick={draw}
            disabled={state === "drawing"}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {state === "drawing" ? "Drawing…" : "Yes, draw names"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            Not yet
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={state === "drawing"}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
        >
          Draw the names
        </button>
      )}
      {error && <p className="mt-2 text-sm text-accent">{error}</p>}
    </div>
  );
}
