import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: {
    absolute:
      "Yankee Swap Rules — How to Play, Number Draw & the Final Swap",
  },
  description:
    "Yankee swap rules the New England way: draw numbered slips, lowest number picks first, and number one gets the famous final swap that closes the game.",
  alternates: {
    canonical: "/yankee-swap-rules",
  },
  openGraph: {
    url: "/yankee-swap-rules",
  },
};

// ---------- content ----------

const steps = [
  {
    name: "Everyone brings one wrapped gift",
    text: "One present per person, inside the price the host named in the invite — around New England offices that is usually twenty to twenty-five dollars. Gifts go into a single pile with no name tags anywhere.",
  },
  {
    name: "Draw numbered slips",
    text: "Folded numbers in a hat, or a dealt playing card per person. Your number is your position in the game, and it is drawn before anyone touches a gift — that separation is the ritual that makes a yankee swap feel orderly.",
  },
  {
    name: "Number one opens",
    text: "The lowest number goes first and opens any present from the pile, holds it up, and shows the room. The opening turn is always an open — there is nothing in play to steal yet.",
  },
  {
    name: "Numbers ascend: open or steal",
    text: "Each number in order either opens an unopened present or steals one that is already open. Whoever gets robbed is on turn again immediately: they open from the pile or steal from somebody else — never the present they just lost. A gift locks after it has been stolen three times.",
  },
  {
    name: "Number one takes the final swap",
    text: "After the highest number settles, the game is not over. Number one stands up, puts their present back, and takes any present on the table — that closing move is the final swap, the signature New England ending, and it is the reason nobody envies the person who drew the first slip.",
  },
];

const coreRules = [
  "Numbers are drawn before anyone touches the pile — the order is set by the draw and holds all game.",
  "Lowest number plays first, numbers ascend, and nobody skips or trades positions.",
  "Only presents that have been opened can be stolen, never wrapped ones.",
  "A present locks after three steals and stays with its holder for good.",
  "Number one closes the game with the final swap — one last take, and then everyone keeps what they are holding.",
];

const variations = [
  {
    name: "What number one may take in the final swap",
    body: "The loose version lets number one take any present on the table, even locked ones. The tight version limits the choice to presents that are still unlocked, so the steal cap protects early holders right to the end. Pick one before the game starts — this is the single most argued-about line in New England swap etiquette.",
  },
  {
    name: "How the order is drawn",
    body: "Hat slips are the tradition, dealt playing cards are the shortcut, and a shuffled board does the same job in a second. Some offices add a house flavor — birthdays instead of a draw, or reverse seniority — but whatever produces the list, it is fixed before the first turn and never renegotiated.",
  },
  {
    name: "A lower steal cap",
    body: "Because the final swap supplies the drama, many New England groups run the body of the game with a cap of one or two steals per present instead of three. Tighter and quicker, and it stops the last ten minutes from turning into three people fighting over one gift box while number one waits to close the game.",
  },
  {
    name: "Open first, steal second",
    body: "The two-pass version runs the numbers once with opens only, then runs the same order again with stealing allowed. Slower, calmer, and popular with big offices — everyone gets to see the whole pile before the taking starts, which makes the steals about the presents instead of the suspense.",
  },
];

const houseRules = [
  "A price cap written into the invite. Twenty to twenty-five dollars is the typical New England range. The number matters more than the amount — an even pile is what keeps the final swap from being a formality.",
  "No cash and no gift cards. A fifty-dollar bill beats everything on the table, which makes the number draw pointless. If someone insists on a gift card, cap the value at the same limit as wrapped gifts.",
  "Presents must work for anyone in the room. No age-specific, gender-specific, or hobby-specific gifts — in a yankee swap any present can land on any desk, and it will.",
  "Late arrivals draw from the numbers that are left, usually the top of the range. The order is never reshuffled mid-game to be polite — that rule is what the whole number draw is for.",
];

const faqs = [
  {
    q: "Why is it called a yankee swap?",
    a: "Nobody knows for certain, and every New England family has its own story. The oldest tellings connect it to the region's trading culture and to Civil War prisoner exchanges; what is certain is that the name is New England's, and that the same game answers to white elephant and dirty santa everywhere else.",
  },
  {
    q: "Does number one really get the final swap?",
    a: "In the traditional New England version, yes. After the highest number finishes, number one puts their present back and takes any present on the table. It exists to balance the first draw: opening first means picking blind, so the final swap is the compensation for spending the whole game watching everyone else react.",
  },
  {
    q: "What can number one take in the final swap?",
    a: "House decision. The loose ruling is any present, locked or not; the tight ruling is any present that is still unlocked. The loose version is more dramatic, the tight one protects presents that already survived three steals. Announce the ruling before the first turn, not when number one is standing up.",
  },
  {
    q: "How is a yankee swap different from white elephant?",
    a: "The core game is the same — one pile, a fixed order, open or steal, three steals and a gift locks. A yankee swap differs in the details: the order comes from drawn numbered slips rather than a shuffle, and number one gets the final swap at the end. The full white elephant game rules, with the plain default set, are written up separately on this site.",
  },
  {
    q: "Can the last player swap too?",
    a: "Some houses run both endings: the last player may take one unlocked present, and then number one takes the final swap. It is a looser game with two twists instead of one. Play one or the other, not both silently — agree before the draw which ending your table uses.",
  },
  {
    q: "What if someone loses their number slip?",
    a: "The draw order stands, slip or no slip — that is why the host reads the numbers aloud as they are drawn. A lost slip is not a lost turn. Only if two people claim the same number do you redraw, and both players draw fresh.",
  },
];

// ---------- structured data ----------

const howtoJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to play a yankee swap",
  description:
    "Yankee swap rules as played in New England: draw numbered slips, lowest number opens first, numbers ascend with opens and steals, and number one closes the game with the final swap.",
  step: steps.map((s, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: s.name,
    text: s.text,
  })),
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function YankeeSwapRules() {
  return (
    <>
      <JsonLd data={howtoJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Yankee Swap Rules", path: "/yankee-swap-rules" },
        ]}
      />

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Yankee Swap Rules
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            A yankee swap is New England&apos;s name for the steal-a-present
            game, and the region plays it with two signatures of its own: the
            order comes from numbered slips drawn from a hat, and number one
            gets one final swap after the last turn to close the game. This
            page covers the yankee swap rules as they are actually played at
            office parties and Christmas Eve tables from Boston to Burlington —
            the number draw, the final swap, the variations your table will
            vote on, and where the rules differ from the white elephant
            default. When you are ready,{" "}
            <Link
              href="/yankee-swap-generator"
              className="text-accent underline"
            >
              run the game online
            </Link>{" "}
            — the board draws the order, tracks the steal counts, and keeps
            the whole table on one screen.
          </p>
        </section>

        <section aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-xl font-semibold">
            How the game works, step by step
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
            {steps.map((s) => (
              <li key={s.name}>
                <strong className="text-foreground">{s.name}.</strong> {s.text}
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="core-rules">
          <h2 id="core-rules" className="text-xl font-semibold">
            The rules most groups use
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Read these out before the slips go around the hat:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {coreRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Against the white elephant default, two lines differ: where the
            order comes from — numbered slips rather than a straight shuffle —
            and the ending, which is the final swap instead of the last player
            simply finishing. Everything else, including the three-steal lock,
            is the same game. The{" "}
            <Link
              href="/white-elephant-rules"
              className="text-accent underline"
            >
              white elephant game rules
            </Link>{" "}
            are written up separately if you want the plain version your
            group can rename.
          </p>
        </section>

        <section aria-labelledby="variations">
          <h2 id="variations" className="text-xl font-semibold">
            Variations and local etiquette
          </h2>
          <dl className="mt-4 space-y-3 text-sm leading-relaxed">
            {variations.map((v) => (
              <div key={v.name}>
                <dt className="font-medium">{v.name}</dt>
                <dd className="mt-1 text-muted">{v.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Mid-page CTA */}
        <div className="rounded-lg border border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm font-medium">
            Settled on your ending? The{" "}
            <Link
              href="/yankee-swap-generator"
              className="text-accent underline"
            >
              yankee swap generator
            </Link>{" "}
            has the slips drawn and the board up in under a minute.
          </p>
          <Link
            href="/yankee-swap-generator"
            className="mt-4 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
          >
            Start a yankee swap game
          </Link>
        </div>

        <section aria-labelledby="house-rules">
          <h2 id="house-rules" className="text-xl font-semibold">
            House rules that keep it friendly
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A yankee swap is a slow-motion negotiation with your coworkers,
            which is why New England hosts write these four down:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {houseRules.map((r) => (
              <li key={r.slice(0, 24)}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            And if half the room would rather give in secret than take in the
            open, the{" "}
            <Link href="/" className="text-accent underline">
              Secret Santa Generator
            </Link>{" "}
            on the home page is the paired-draw version of this same site.
          </p>
        </section>

        <section aria-labelledby="faq">
          <h2 id="faq" className="text-xl font-semibold">
            FAQ
          </h2>
          <div className="mt-4 divide-y divide-border rounded-lg border border-border">
            {faqs.map((f) => (
              <details key={f.q} className="px-4 py-3">
                <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
