"use client";

import { useState } from "react";

export default function RemoveMeButton({ removeToken }: { removeToken: string }) {
  const [state, setState] = useState<"idle" | "confirm" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setState("confirm");
    try {
      const res = await fetch("/api/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: removeToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Removal failed");
      }
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Removal failed");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="text-sm font-medium text-accent-green">
        Your data has been removed from this draw. No further emails will be sent.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={remove}
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium hover:border-accent hover:text-accent"
      >
        {state === "confirm" ? "Click again to confirm removal" : "Remove my data"}
      </button>
      {state === "error" && <p className="mt-2 text-xs text-accent">{error}</p>}
    </div>
  );
}
