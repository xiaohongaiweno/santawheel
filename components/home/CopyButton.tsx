"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied",
  ariaLabel,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  ariaLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={ariaLabel ?? label}
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:text-accent"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
