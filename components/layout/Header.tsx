import Link from "next/link";
import { site } from "@/lib/site";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
          aria-label={`${site.name} home`}
        >
          {/* Wheel mark */}
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-accent"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="2.5" />
            <path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21M5.6 5.6l4.6 4.6M13.8 13.8l4.6 4.6M18.4 5.6l-4.6 4.6M10.2 13.8l-4.6 4.6" />
          </svg>
          <span className="text-base sm:text-lg">{site.name}</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-border/40"
          >
            Home
          </Link>
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-surface bg-accent hover:bg-accent-strong transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}
