"use client";

import { useEffect, useState } from "react";

/**
 * Reveals the assignment behind a short wheel-spin animation.
 * The name is already in the server-rendered HTML (this is the participant's
 * own private page), so this is pure delight, not a security boundary.
 * Respects prefers-reduced-motion by revealing instantly.
 */
export default function RevealCard({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"hidden" | "spinning" | "shown">("hidden");

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setPhase("shown");
    }
  }, []);

  function reveal() {
    if (phase !== "hidden") return;
    setPhase("spinning");
    window.setTimeout(() => setPhase("shown"), 1200);
  }

  if (phase === "shown") {
    return <>{children}</>;
  }

  return (
    <button
      onClick={reveal}
      aria-label="Tap to reveal who you are drawing for"
      className="group mt-6 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-accent/50 bg-surface p-10 text-center transition-colors hover:border-accent"
    >
      <svg
        className={`${phase === "spinning" ? "animate-spin" : "group-hover:rotate-45"} transition-transform duration-700`}
        width="56"
        height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#b3402a"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21M5.6 5.6l4.6 4.6M13.8 13.8l4.6 4.6M18.4 5.6l-4.6 4.6M10.2 13.8l-4.6 4.6" />
      </svg>
      <span className="mt-4 text-sm font-medium text-accent">
        {phase === "spinning" ? "Shuffling names…" : "Tap to reveal your person"}
      </span>
    </button>
  );
}
