import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: {
    absolute:
      "Dirty Santa Rules — How to Play, the Steal Cap & Southern House Rules",
  },
  description:
    "Dirty santa rules the Southern way: the once-swapped-never-stolen rule, how it differs from white elephant, local variations, and a calmer version for kids.",
  alternates: {
    canonical: "/dirty-santa-rules",
  },
  openGraph: {
    url: "/dirty-santa-rules",
  },
};

// ---------- content ----------

const steps = [
  {
    name: "Everyone brings one wrapped gift",
    text: "One present per person, inside the price cap the host set in the invite. Down South the range is usually fifteen to twenty-five dollars, and a well-chosen gag gift is not a violation — it is a tradition.",
  },
  {
    name: "Draw the playing order",
    text: "Folded slips in a hat, playing cards, or the board's shuffle — whatever decides it, it happens before anyone touches the pile, and the order holds for the whole game.",
  },
  {
    name: "The first player opens",
    text: "Turn one is always an open: there is nothing in play to steal yet. The first present gets held up and shown around, because everything that happens later depends on the room seeing it.",
  },
  {
    name: "Each player opens or steals — once",
    text: "On your turn, open from the pile or steal any opened present that has never changed hands. The Southern rule bites here: the moment a gift is stolen, it goes dead — nobody can take it again, ever. The person you robbed goes again immediately and opens from the pile.",
  },
  {
    name: "Finish when the pile runs out",
    text: "The game ends when the last unopened present is opened and the last turn settles. Because stolen gifts freeze instantly, the final minutes stay calm — nobody's box can be yanked out from under them at the last second.",
  },
];

const coreRules = [
  "You can only steal a present that has already been opened — never a wrapped one.",
  "Once a present has changed hands, it can never be stolen again. This is the rule that makes dirty santa dirty santa.",
  "Whoever is stolen from plays again immediately and opens a new gift from the pile.",
  "The first player can only open — nothing is in play to steal yet.",
  "No trading after the game ends. When the pile is empty, whatever you are holding is yours.",
];

const variations = [
  {
    name: "Two moves before a gift freezes",
    body: "The strict Southern default is one steal and done. Some households let a present move twice before it dies — a looser game with a little more chase in it. Agree on which version before the first turn, because it is the difference between a quiet hour and a loud one.",
  },
  {
    name: "One steal per turn chain",
    body: "Bigger parties sometimes limit each turn to a single steal before somebody has to open from the pile. Tighter and faster: with a dozen or more players it keeps the middle of the game from stalling while three people argue over one candle.",
  },
  {
    name: "Gag-gift rounds",
    body: "The old-school version plays the presents for laughs: deliberately terrible gifts, half of them regifted from last year, and the unofficial winner is whoever gets stuck with the worst box. Set the tone in the invite, or the one person who brings a serious present will be disappointed.",
  },
  {
    name: "The quiet version for younger kids",
    body: "Set the steal cap to zero and the game becomes a pick-in-order draw: each child opens one present when their turn comes, no crying, no snatching. Put the youngest at the front of the order so they pick while the good stuff is still in the pile.",
  },
];

const houseRules = [
  "A price cap in the invite, not a shrug. Fifteen to twenty-five dollars is the usual Southern range. Without a number in writing, someone brings a fifty-dollar basket and someone brings a keychain, and the pile is uneven all night.",
  "New gifts only. Regifting is the sin the game's name jokes about, and it is allowed exactly once a year — but the room can tell a dusty box, and the person who brought it will hear about it until Easter.",
  "Nothing perishable, nothing alive. A live animal sounds like a hilarious December story and becomes a February problem. Fruitcake from last Christmas is technically allowed and morally complicated.",
  "The host brings two spare gifts. Somebody always forgets, and a spare in the pile means the group never has to improvise a ruling in front of the person who forgot.",
];

const faqs = [
  {
    q: "Why is it called dirty Santa?",
    a: "The dirty part is the stealing. Taking a present straight out of someone's hands feels a little naughty, and below the Mason-Dixon line and across the Midwest the name stuck to this version of the game while New England calls the same thing a yankee swap and the rest of the country says white elephant.",
  },
  {
    q: "Can the same gift be stolen twice?",
    a: "In the default Southern version, no — the first steal freezes the present with its new holder. Some households allow two moves before it freezes, which makes for a livelier game. Decide before the first turn; on a board it is just the steal cap set to one or two.",
  },
  {
    q: "How is dirty Santa different from white elephant?",
    a: "The skeleton is identical: one wrapped pile, a fixed order, open or steal. The difference is the freeze rule — white elephant's default lets a present be stolen three times before it locks, while dirty santa kills a present after its first move, so the game runs quieter. The full white elephant game rules, including the three-steal default, are written up separately.",
  },
  {
    q: "What makes a good dirty Santa gift?",
    a: "Something funny that is also genuinely usable — a ridiculous mug that holds coffee, a ugly-but-warm blanket, a novelty tool that actually works. Fifteen to twenty-five dollars, no names on the wrap, and nothing so personal that only one person in the room would ever want it.",
  },
  {
    q: "Do we need an even number of players?",
    a: "No. Dirty santa runs on a turn order, not on pairs, so any headcount works — odd, even, or the eleven people who actually showed up. Nobody needs to sit out to make the math work.",
  },
  {
    q: "Can you play dirty Santa without any stealing?",
    a: "Yes. Set the steal cap to zero and the game becomes a straight pick-in-order draw — everyone opens one present on their turn and that is the whole game. That is the standard version for groups with small children or coworkers who take competition personally.",
  },
];

// ---------- structured data ----------

const howtoJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to play dirty santa",
  description:
    "Dirty santa rules as played across the South and Midwest: one wrapped gift each, a drawn order, open or steal — and a present freezes the first time it changes hands.",
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

export default function DirtySantaRules() {
  return (
    <>
      <JsonLd data={howtoJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Dirty Santa Rules", path: "/dirty-santa-rules" },
        ]}
      />

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Dirty Santa Rules
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Dirty santa is what the South and the Midwest call the steal-a-present
            game, and the region plays it with one twist of its own: a present
            dies the first time it changes hands. This page covers the dirty
            santa rules as they are actually played at Christmas parties from
            Texas to Ohio — the freeze rule, how it differs from the white
            elephant default, the variations worth voting on before the first
            turn, and a calmer version for tables with kids. When you are ready,{" "}
            <Link
              href="/dirty-santa-generator"
              className="text-accent underline"
            >
              run the game online
            </Link>{" "}
            — the board draws the order, tracks which presents are frozen, and
            shows the pile on one screen.
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
            Read these out loud before the first turn and the game will run
            without an argument all night:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {coreRules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The one difference from white elephant worth saying plainly: white
            elephant&apos;s default lets a present be stolen three times before
            it locks, while dirty santa freezes it after the first. If your
            group would rather have that louder version, the{" "}
            <Link
              href="/white-elephant-rules"
              className="text-accent underline"
            >
              white elephant game rules
            </Link>{" "}
            are written up separately. On a board the two games are the same
            setting — a steal cap of one instead of three.
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
            Settled on your house&apos;s version? The{" "}
            <Link
              href="/dirty-santa-generator"
              className="text-accent underline"
            >
              dirty santa generator
            </Link>{" "}
            has the game running in under a minute.
          </p>
          <Link
            href="/dirty-santa-generator"
            className="mt-4 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
          >
            Start a dirty santa game
          </Link>
        </div>

        <section aria-labelledby="house-rules">
          <h2 id="house-rules" className="text-xl font-semibold">
            House rules that keep it friendly
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Dirty santa is a game about taking things from people you have to
            see again in January. These four rules are what experienced hosts
            add to keep it fun:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {houseRules.map((r) => (
              <li key={r.slice(0, 24)}>{r}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            And if your table would rather give in secret than take in the
            open, the{" "}
            <Link href="/" className="text-accent underline">
              Secret Santa Generator
            </Link>{" "}
            on the home page runs the paired version of the same evening.
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
