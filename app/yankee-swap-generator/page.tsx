import type { Metadata } from "next";
import Link from "next/link";
import CreateGameForm from "@/components/we/CreateGameForm";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: { absolute: "Yankee Swap Generator – Free Number Draw & Steal Rules" },
  description:
    "Yankee swap generator: number the players, then open a wrapped gift or steal an opened one each turn, with a steal cap. Free, no sign-up, one phone runs it.",
  alternates: {
    canonical: "/yankee-swap-generator",
  },
  openGraph: {
    url: "/yankee-swap-generator",
  },
};

// ---------- structured data ----------

const faqs = [
  {
    q: "Why is it called a Yankee swap?",
    a: "It is the New England name for the same holiday game the rest of the country calls white elephant or dirty Santa. The swap part is literal: gifts are opened in front of the room and can be taken by a later player, so presents keep changing hands until the order runs out. Nobody is assigned a person and nobody shops for a specific name.",
  },
  {
    q: "Is a Yankee swap the same as a white elephant exchange?",
    a: "Almost — same shape, different local etiquette. Both use a wrapped pile, a fixed turn order, and stealing. New England groups tend to be a little politer about it: a lower steal cap, or a rule that the last player may swap rather than steal. The generator runs the game itself, so the rules you pick are the rules the board enforces.",
  },
  {
    q: "How is the picking order decided?",
    a: "The generator shuffles everyone into a random numbered order the moment you create the board. The organizer can move people up or down before the first turn — useful when someone has to leave early — and after the first turn the order locks so it cannot be gamed.",
  },
  {
    q: "What gift limit do most Yankee swaps use?",
    a: "Ten to twenty-five dollars is the usual range, and the number matters less than everyone agreeing to it before they shop. The generator never handles money or purchases: it labels the pile, draws the order, and tracks who is holding what.",
  },
  {
    q: "Does everyone need to bring a gift?",
    a: "Yes, one wrapped gift per player. Keep the pile the same size as the group or the last players in the order end up with an empty table. You can type gift labels in when you set up the game, or leave the field blank and they become Gift 1, Gift 2, and so on.",
  },
  {
    q: "How many times can a present be stolen?",
    a: "Three by default, adjustable from 0 to 10 before or during the game. When a gift hits the cap it locks with whoever is holding it and cannot be taken again — the polite New England version of ending the game on time.",
  },
  {
    q: "Can the first player steal something?",
    a: "No. There is nothing opened yet, so the first turn is always a pick from the pile. Stealing opens up from the second turn onward.",
  },
  {
    q: "Can I take back the gift that was just stolen from me?",
    a: "No. Whoever was stolen from plays again immediately and must open a new gift from the pile. That single rule is what stops two players bouncing the same present back and forth for the last ten minutes of the party.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SantaWheel Yankee Swap Generator",
  alternateName: "Yankee Swap Generator",
  url: "https://santawheel.com/yankee-swap-generator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description:
    "Free Yankee swap generator. Numbers the players at random, then runs each turn as either opening a wrapped gift or stealing one already opened, with a configurable steal cap.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function YankeeSwapGenerator() {
  return (
    <>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Yankee Swap Generator", path: "/yankee-swap-generator" },
        ]}
      />

      {/* Above the fold */}
      <section className="mx-auto w-full max-w-2xl px-4 pb-10 pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Yankee Swap Generator
        </h1>
        <p className="mt-3 text-base text-muted">
          Number the group at random, then take turns: open a wrapped present from
          the pile, or steal one that has already been opened. Each gift can be
          taken three times before it locks — set your own cap if your crowd plays
          rougher.
        </p>
        <a
          href="#create"
          className="mt-5 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
        >
          Start a Yankee swap
        </a>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-muted">
          <li>Free</li>
          <li aria-hidden="true">·</li>
          <li>No sign-up</li>
          <li aria-hidden="true">·</li>
          <li>No app to install</li>
          <li aria-hidden="true">·</li>
          <li>Up to 100 players</li>
        </ul>
      </section>

      {/* Create form */}
      <div className="border-t border-border bg-surface">
        <section
          id="create"
          aria-labelledby="create-heading"
          className="mx-auto w-full max-w-2xl scroll-mt-4 px-4 py-10"
        >
          <h2 id="create-heading" className="text-xl font-semibold">
            Set up the swap
          </h2>
          <p className="mt-2 text-sm text-muted">
            Paste the group, name the presents if you want them called out loud,
            and choose how often one gift may be stolen. You get a board link
            straight away.
          </p>
          <div className="mt-6">
            <CreateGameForm />
          </div>
        </section>
      </div>

      {/* Below the fold */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
          <section aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="text-xl font-semibold">
              How a Yankee swap round works
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>
                <strong className="text-foreground">Everyone brings one wrapped gift.</strong>{" "}
                Keep it unwrapped-looking on the outside — no name tags, no
                ribbons that give the game away. Paste the group and, if you
                like, a short label for each present so the room knows what got
                opened without anyone unwrapping it twice.
              </li>
              <li>
                <strong className="text-foreground">The generator numbers the players.</strong>{" "}
                Numbers are drawn at random, and the organizer can reorder anyone
                before the first turn. After that the order is fixed, which is
                the whole point: nobody negotiates their position halfway
                through.
              </li>
              <li>
                <strong className="text-foreground">Each turn is open or steal.</strong>{" "}
                Player one picks from the pile. From then on a turn is either a
                fresh present or someone else&apos;s opened one. The person you
                steal from plays again immediately and has to open a new gift —
                no instant revenge steals.
              </li>
              <li>
                <strong className="text-foreground">The cap ends the game on time.</strong>{" "}
                Once a gift has been stolen the maximum number of times it locks
                in place. Whatever people are holding when the order runs out is
                the final result.
              </li>
            </ol>
          </section>

          <section aria-labelledby="names">
            <h2 id="names" className="text-xl font-semibold">
              Yankee swap, white elephant or dirty Santa?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Three names, one game. New England says Yankee swap, most of the
              country says white elephant, and the South and Midwest often say
              dirty Santa. What changes between them is the etiquette rather than
              the mechanics: how many steals are allowed per gift, whether the
              last player gets a free swap, whether gag gifts are the point or an
              embarrassment. This generator runs the same engine under all three
              names —{" "}
              <Link href="/white-elephant-generator" className="text-accent underline">
                white elephant
              </Link>{" "}
              and{" "}
              <Link href="/dirty-santa-generator" className="text-accent underline">
                dirty Santa
              </Link>{" "}
              have their own pages if that is what your invitation says.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              If nobody is stealing at all, you do not want this game — you want a
              straight one-to-one draw. The{" "}
              <Link href="/gift-exchange-generator" className="text-accent underline">
                gift exchange generator
              </Link>{" "}
              pairs everyone up so each person shops for one name instead.
            </p>
          </section>

          <section aria-labelledby="rules">
            <h2 id="rules" className="text-xl font-semibold">
              House rules you can set
            </h2>
            <dl className="mt-4 space-y-3 text-sm leading-relaxed">
              <div>
                <dt className="font-medium">Steal cap per gift</dt>
                <dd className="text-muted">
                  Three by default, anywhere from 0 to 10. At the limit the gift
                  locks with its current holder forever. Set it to 0 for a
                  polite pick-only swap, or push it up if your group treats the
                  stealing as the main event.
                </dd>
              </div>
              <div>
                <dt className="font-medium">The numbered order</dt>
                <dd className="text-muted">
                  Random at creation, editable by the organizer until the first
                  turn. Put the person who has to leave early at number one, or
                  give the kids the front of the queue.
                </dd>
              </div>
              <div>
                <dt className="font-medium">No instant steal-backs</dt>
                <dd className="text-muted">
                  Fixed on purpose. Being stolen from puts you straight back on
                  turn with an unopened gift, so the same present cannot ping-pong
                  between two people while the rest of the room watches.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Undo</dt>
                <dd className="text-muted">
                  Any move can be taken back one step at a time and replayed. On a
                  phone, with a room full of people shouting, a mis-tap is not an
                  edge case.
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Want the full New England version before you set anything? The{" "}
              <Link
                href="/yankee-swap-rules"
                className="text-accent underline"
              >
                yankee swap rules
              </Link>{" "}
              cover the number draw, the final swap that closes the game, and
              the etiquette points your table will vote on.
            </p>
          </section>

          <section aria-labelledby="for-offices">
            <h2 id="for-offices" className="text-xl font-semibold">
              Yankee swap at the office
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              An office swap has a hard start time, a conference room, and a
              budget email nobody read. Put the board on the meeting-room screen
              and let one person tap: the current number, every present still in
              the pile, and how many times each opened gift has been stolen are
              all visible on a single page. A cap of two or three keeps the last
              ten minutes from becoming a negotiation, and the undo button covers
              the wrong tap that always happens when someone leans over the
              laptop. Nobody installs anything, which is what makes it work for
              the half of the team dialling in.
            </p>
          </section>

          <section aria-labelledby="for-families">
            <h2 id="for-families" className="text-xl font-semibold">
              Yankee swap with family
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Family swaps span three generations, at least one language gap, and
              somebody who refuses to install an app. There is nothing to install
              here: the board is a web page, one phone drives it, everyone else
              watches. Turn the steal cap down — or to zero — when younger players
              are at the table, and put whoever has to leave early at number one.
              The whole game is rebuilt from the move history, so a locked screen
              or a dropped connection loses nothing.
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
      </div>
    </>
  );
}
