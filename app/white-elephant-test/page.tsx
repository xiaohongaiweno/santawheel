import type { Metadata } from "next";
import Link from "next/link";
import TestGameForm from "@/components/we/TestGameForm";

/**
 * Internal walk-through page for the white elephant game. Deliberately not
 * linked from anywhere, not in the sitemap, and noindex/nofollow.
 */
export const metadata: Metadata = {
  title: "White elephant test harness",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "/white-elephant-test" },
  openGraph: { url: "/white-elephant-test" },
};

const rules = [
  "Everyone gets a fixed random turn order. The organizer can move people up or down before starting.",
  "On your turn, open one unopened gift from the pool, or steal one that somebody already opened.",
  "Whoever gets stolen from is up immediately and must open a new gift from the pool — stealing back is not allowed.",
  "A gift locks once it has been stolen the limit number of times (default 3). Locked gifts can never be taken again.",
  "The first player of the first round may only open from the pool.",
  "When every turn is used, whoever is holding a gift holds the final result.",
];

export default function WhiteElephantTestPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Internal test page · not indexed
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">White elephant walk-through</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Build a throwaway game to check the rules end to end. Progress is stored on the server, so
        you can reload the board or open it on a second phone at any time.
      </p>

      <TestGameForm />

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Rules this build implements</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ol>
      </section>

      <p className="mt-8 text-xs text-muted">
        Back to the site:{" "}
        <Link href="/" className="text-accent underline">
          home
        </Link>
      </p>
    </article>
  );
}
