"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Organizer control for scheduled draws on a collect-first exchange:
 * pick a future time, and the names are drawn automatically when it passes
 * (checked every 5 minutes by the cron worker).
 */
export default function ScheduleDrawButton({
  token,
  initialScheduledAt,
}: {
  token: string;
  initialScheduledAt: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(() => toLocalInputValue(initialScheduledAt));
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function post(scheduledAt: string | null) {
    setState("saving");
    setError(null);
    try {
      const res = await fetch("/api/manage/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, scheduledAt }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save. Try again.");
        setState("error");
        return;
      }
      setState("idle");
      router.refresh();
    } catch {
      setError("Network error — try again.");
      setState("error");
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Schedule the draw (optional)</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Prefer not to babysit the dashboard? Pick a time and we&apos;ll draw the
        names automatically — within about 5 minutes of it. Everyone gets
        their assignment by email just like a manual draw. You can cancel any
        time before then.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (state === "error") setState("idle");
          }}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={() => {
            if (!value) return;
            const iso = new Date(value).toISOString();
            void post(iso);
          }}
          disabled={state === "saving" || !value}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {state === "saving" ? "Saving…" : "Schedule"}
        </button>
        {initialScheduledAt && (
          <button
            onClick={() => {
              setValue("");
              void post(null);
            }}
            disabled={state === "saving"}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Cancel schedule
          </button>
        )}
      </div>
      {initialScheduledAt && (
        <p className="mt-2 text-xs text-accent-green">
          Scheduled:{" "}
          {new Date(initialScheduledAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      )}
      {state === "error" && error && (
        <p className="mt-2 text-xs text-accent">{error}</p>
      )}
    </div>
  );
}
