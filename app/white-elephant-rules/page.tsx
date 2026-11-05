import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: {
    absolute:
      "White Elephant Game Rules — How to Play, Steal Caps & Variations",
  },
  description:
    "White elephant gift exchange rules explained step by step: how stealing works, the three-steal cap, variations, and house rules that keep the game friendly.",
  alternates: {
    canonical: "/white-elephant-rules",
  },
  openGraph: {
    url: "/white-elephant-rules",
  },
};

// ---------- content ----------

const steps = [
  {
    name: "Everyone brings one wrapped gift",
    text: "Each person contributes one wrapped present to the pile, within a budget the group agreed on in advance. No name tags — nobody should know who brought what.",
  },
  {
    name: "Set the picking order",
    text: "Draw numbers from a hat, deal playing cards, or let the board shuffle the group. Once the game starts the order is fixed; a common alternative is going by birthday, youngest to oldest.",
  },
  {
    name: "The first player opens a gift",
    text: "Player one takes any present from the pile, unwraps it, and shows it to the room. There is nothing to steal yet, so the first turn is always an open.",
  },
  {
    name: "Each following player opens or steals",
    text: "On your turn, either open an unopened present from the pile or steal one that has already been opened. If you steal, the person you took from plays again immediately: they open a new present or steal from someone else — never the one they just lost.",
  },
  {
    name: "Resolve the chain and finish",
    text: "A turn can set off a chain of steals that ends only when someone chooses to open from the pile. The game is over when the pile is empty and the last chain resolves; everyone keeps whatever they are holding.",
  },
];

const defaultRules = [
  "You can only steal a gift that has already been opened — never a wrapped one.",
  "A gift locks after it has been stolen three times: it stays with its current holder and is out of play.",
  "Whoever is stolen from goes again immediately and must open a new gift from the pile (or steal from a different player).",
  "You cannot steal back the present you just lost. This single rule is what stops two people bouncing one gift back and forth all evening.",
  "The first player can only open — there is nothing in play to steal yet.",
];

const variations = [
  {
    name: "The steal cap",
    body: "Three is the common default; groups choose anywhere from one to ten. A higher cap makes the game looser: more chains, more drama, a longer game. A cap of one or two tightens it up, and zero turns the whole exchange into a calm pick-in-order round.",
  },
  {
    name: "Immediate steal-back",
    body: "The default is that it is not allowed — you cannot retake the gift you just lost. Some groups allow it anyway, which makes the game looser but risks a two-person ping-pong that the room gets tired of fast. If you allow it, pair it with a low steal cap.",
  },
  {
    name: "A maximum number of steals per round",
    body: "Large groups sometimes cap how many steals can happen in a single turn chain — three is typical. This tightens the game and keeps the last rounds from dragging, at the cost of some drama. Without the cap, a chain runs until someone opens from the pile.",
  },
];

const houseRules = [
  "A price cap, stated in the invite. Twenty to twenty-five dollars is the usual office range; if it is not written down, someone will spend sixty and someone will spend five.",
  "No cash or gift cards. A fifty-dollar bill beats every other present in the pile, and the game stops being a game. If you do allow them, say so up front.",
  "Gifts must be generic: any player, any age, any taste could end up holding them. A present only one person wants creates a boring chain where nobody steals.",
  "Say one nice thing before you steal. Compliment the gift, or its owner, before you take it. It sounds ceremonial, but it keeps stealing from feeling personal — which matters most in offices and families.",
];

const arguments_ = [
  {
    q: "“Can I steal it back?”",
    a: "Default answer: no. You lost it, you move on — open from the pile or steal from somebody else. If your group wants to allow immediate steal-backs, agree on it before the first turn, and expect longer chains.",
  },
  {
    q: "Someone didn’t bring a gift",
    a: "Decide before you start, not when it happens. The clean options: they sit out and just watch, or the group pools a spare present so they can still play. What you want to avoid is improvising a ruling in front of everyone.",
  },
  {
    q: "We don’t have an even number of people",
    a: "Not a problem — white elephant game rules never need pairs. Play runs on a fixed order, not on matching people up, so odd counts, big counts, and last-minute cancellations all work the same way.",
  },
  {
    q: "Someone shows up late",
    a: "The standard fix: latecomers take the last spot in the order, no exceptions, announced at the start. Re-shuffling the order mid-game to be polite breaks the one thing the game depends on — that the order is fixed.",
  },
];

const faqs = [
  {
    q: "What happens when someone steals from me?",
    a: "You are up again immediately. You either open a new present from the pile or steal from a different player — the only thing you cannot do is take back the gift you just lost. Your turn is never skipped as compensation.",
  },
  {
    q: "Can the first player steal?",
    a: "No — when the first player takes their turn, no presents have been opened yet, so there is nothing to steal. Some groups compensate the first player with a final swap at the very end; treat that as a variation and agree on it in advance.",
  },
  {
    q: "How long does a game take?",
    a: "Roughly two minutes per person, plus a little extra for chains of steals. A group of ten usually finishes in twenty to thirty minutes; big chains in the final rounds are what stretch the time.",
  },
  {
    q: "What is a good gift budget?",
    a: "Twenty to twenty-five dollars is the typical office range; families often go lower. The number matters less than stating it in the invite so the pile stays even.",
  },
  {
    q: "Does the game work with kids?",
    a: "Yes. Turn the steal cap down to one or two so chains stay short, put whoever has to leave early first in the order, and lean on the house rule that you say something nice before you steal.",
  },
  {
    q: "Why is it called a white elephant?",
    a: "The name comes from the old story of the King of Siam gifting a rare white elephant: magnificent, impossible to refuse, and ruinously expensive to keep. The game is built on the same joke — impressive presents nobody really wants to be stuck with.",
  },
  {
    q: "Can we play without any stealing?",
    a: "Yes. Set the steal cap to zero and the game becomes a straight pick-in-order draw — everyone opens one present when their turn comes, and that is it.",
  },
];

// ---------- structured data ----------

const howtoJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to play a white elephant gift exchange",
  description:
    "The white elephant gift exchange rules most groups use, step by step: bring one wrapped gift each, draw a picking order, then open presents or steal the ones already opened.",
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

export default function WhiteElephantRules() {
  return (
    <>
      <JsonLd data={howtoJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "White Elephant Game Rules", path: "/white-elephant-rules" },
        ]}
      />

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            White Elephant Game Rules
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Everything a group needs to play: the white elephant gift exchange
            rules step by step, the default rule set most groups actually use,
            the variations worth agreeing on in advance, and honest answers to
            the arguments that come up every year. When you are ready, you can{" "}
            <Link
              href="/white-elephant-generator"
              className="text-accent underline"
            >
              run the game online
            </Link>{" "}
            — the board keeps the order, tracks the steal counts, and locks
            gifts for you.
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

        <section aria-labelledby="default-rules">
          <h2 id="default-rules" className="text-xl font-semibold">
            The rules most groups actually use
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Every white elephant game runs on the same five defaults — house
            wording varies from group to group, but this is the set to read
            out before the first turn:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {defaultRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Agree on the steal cap before the first turn — it is the one number
            the room will argue about if you leave it unstated.
          </p>
        </section>

        <section aria-labelledby="variations">
          <h2 id="variations" className="text-xl font-semibold">
            Variations you can choose
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
            Settled on your rules? The{" "}
            <Link
              href="/white-elephant-generator"
              className="text-accent underline"
            >
              white elephant generator
            </Link>{" "}
            has the group playing in under a minute.
          </p>
          <Link
            href="/white-elephant-generator"
            className="mt-4 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
          >
            Start a white elephant game
          </Link>
        </div>

        <section aria-labelledby="house-rules">
          <h2 id="house-rules" className="text-xl font-semibold">
            House rules that keep it friendly
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The game itself rarely causes bad feelings — the present pile does.
            These four rules are what experienced organizers add:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {houseRules.map((r) => (
              <li key={r.slice(0, 24)}>{r}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="arguments">
          <h2 id="arguments" className="text-xl font-semibold">
            Common arguments and how to settle them
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed">
            {arguments_.map((a) => (
              <div key={a.q}>
                <h3 className="font-medium">{a.q}</h3>
                <p className="mt-1 text-muted">{a.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="names">
          <h2 id="names" className="text-xl font-semibold">
            White elephant vs Yankee Swap vs Dirty Santa
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Three names, one game. White elephant is the general term across
            the United States. New England calls it a{" "}
            <Link
              href="/yankee-swap-generator"
              className="text-accent underline"
            >
              yankee swap
            </Link>
            , where groups traditionally draw numbered slips and the lowest
            number picks first — and number one often gets one final swap at
            the very end as a consolation. The South and much of the Midwest
            say{" "}
            <Link
              href="/dirty-santa-generator"
              className="text-accent underline"
            >
              dirty Santa
            </Link>
            , and local versions there frequently add a rule that once a
            present has changed hands it cannot be stolen again, which makes
            for a much quieter game than the three-steal default. Whatever
            your region calls it, the white elephant generator runs the same
            board for all of them — set the steal cap to match your local
            etiquette and the rest is identical.
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
