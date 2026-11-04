"use client";

import { useState } from "react";

const MAX_LEN = 1000;

/**
 * Self-serve wishlist editor shown on a participant's own assignment page.
 * Saves free text (one idea per line) that their gifter sees on the same page.
 */
export default function WishlistEditor({
  token,
  initialText,
}: {
  token: string;
  initialText: string;
}) {
  const [text, setText] = useState(initialText);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, wishlistText: text }),
      });
      if (!res.ok) throw new Error();
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Your wishlist (optional)</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Leave a few ideas so your Secret Santa has an easy time. One idea per
        line — links welcome. Only the person drawing you can see this.
      </p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value.slice(0, MAX_LEN));
          if (state === "saved" || state === "error") setState("idle");
        }}
        rows={4}
        maxLength={MAX_LEN}
        placeholder={"A good book in my favourite genre\nCandles or anything cozy\nhttps://…"}
        className="mt-3 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          {text.length}/{MAX_LEN}
        </span>
        <button
          onClick={save}
          disabled={state === "saving" || text === initialText}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {state === "saving" ? "Saving…" : "Save wishlist"}
        </button>
      </div>
      {state === "saved" && (
        <p className="mt-2 text-xs text-accent-green">Saved — your Santa can see it now.</p>
      )}
      {state === "error" && (
        <p className="mt-2 text-xs text-accent">
          Could not save. Refresh the page and try again.
        </p>
      )}
    </div>
  );
}
