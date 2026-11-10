import type { Metadata } from "next";
import PrintButton from "@/components/delivery/PrintButton";

export const metadata: Metadata = {
  title: {
    absolute: "Dirty Santa Rules Printable — Free Print-Ready Card",
  },
  description:
    "Print a free dirty Santa rules card: the default Southern rule set, including the steal-once freeze, ready to hand out or pin up.",
  alternates: {
    canonical: "/dirty-santa-rules/printable",
  },
  openGraph: {
    url: "/dirty-santa-rules/printable",
  },
};

// Condensed from the rules already published on /dirty-santa-rules —
// this page is a handout, not a second article, so no new rule text.
const rules = [
  "Everyone brings one wrapped gift inside the price cap the host set — usually $15–$25 in the South.",
  "Draw the playing order before anyone touches the pile. The order holds for the whole game.",
  "The first player can only open — nothing is in play to steal yet.",
  "On your turn, open a gift from the pile or steal one that has already been opened — never a wrapped one.",
  "Once a present has changed hands, it can never be stolen again. It freezes the moment it moves.",
  "Whoever is stolen from plays again immediately and opens a new gift from the pile.",
  "New gifts only, and nothing perishable or alive.",
  "No trading after the game ends: when the pile is empty, what you are holding is yours.",
];

const printCss = `
@media print {
  header, footer, nav, .print-hide { display: none !important; }
  body, .print-card, .print-card * {
    background: #fff !important;
    color: #000 !important;
    box-shadow: none !important;
  }
  .print-card {
    max-width: none !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
  }
  .print-card h1 { font-size: 20pt; }
  .print-card h2 { font-size: 14pt; }
  .print-card ol { font-size: 12pt; line-height: 1.5; }
  .print-card p, .print-card li { font-size: 12pt; }
  a { text-decoration: none !important; color: #000 !important; }
}
@page { margin: 1.5cm; }
`;

export default function DirtySantaRulesPrintable() {
  return (
    <>
      <style>{printCss}</style>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="print-card rounded-xl border border-border bg-surface p-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Dirty Santa Rules (Printable)
          </h1>
          <p className="mt-2 text-sm text-muted">
            One page, the default Southern rule set. Read it out before the
            first turn.
          </p>

          <PrintButton />

          <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm leading-relaxed">
            {rules.map((r) => (
              <li key={r.slice(0, 32)}>{r}</li>
            ))}
          </ol>

          <p className="mt-8 border-t border-border pt-4 text-xs text-muted">
            santawheel.com ·{" "}
            <a
              href="https://santawheel.com/dirty-santa-generator"
              className="underline"
            >
              run a dirty Santa draw online
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
