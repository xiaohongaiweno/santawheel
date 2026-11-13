import type { Metadata } from "next";
import Link from "next/link";
import CreateGameForm from "@/components/we/CreateGameForm";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: { absolute: "Dirty Santa Generator – Free Online Gift Swap with Steals" },
  description:
    "Dirty Santa generator: random turn order, open a wrapped gift or steal one already open, with a three-steal cap you can change. Free, no sign-up, no app.",
  alternates: {
    canonical: "/dirty-santa-generator",
  },
  openGraph: {
    url: "/dirty-santa-generator",
  },
};

// ---------- structured data ----------

const faqs = [
  {
    q: "Why is it called Dirty Santa?",
    a: "Because of the stealing. Unlike a Secret Santa, where each person is quietly assigned a name, Dirty Santa puts every gift in one pile and lets later players take what earlier players already opened. The \"dirty\" is the whole mechanic: your present is only yours once the last turn is over.",
  },
  {
    q: "Is Dirty Santa the same as white elephant?",
    a: "Same game, different regional name — white elephant in the Northeast and West, Dirty Santa in the South and Midwest, Yankee swap in New England. The mechanics are identical: a wrapped pile, a fixed turn order, open or steal, and a limit on repeat steals. Only the house rules and the gift culture differ.",
  },
  {
    q: "What are the standard Dirty Santa rules?",
    a: "One wrapped gift per player, a random turn order, and each turn is either opening an unopened gift or stealing an opened one. A gift that has been stolen three times is locked. Whoever is stolen from plays immediately and must open a new gift, so nobody can steal straight back. The generator enforces all of that without anyone refereeing.",
  },
  {
    q: "Do we have to bring gag gifts?",
    a: "No, and most groups under thirty people do not. The gag-gift tradition comes from the original white elephant idea of passing on something useless. If your group does want them, put a short label for each gift into the setup form — \"Rubber chicken\", \"Mystery box\" — and the board will call them out by name as they are opened.",
  },
  {
    q: "How many steals should we allow per gift?",
    a: "Three is the most common house rule and the generator's default. Two keeps a family game short, five makes the stealing the entertainment, and zero turns it into a plain pick-only round. It can be changed before the game starts or mid-game from the board.",
  },
  {
    q: "Can the last player just swap instead of stealing?",
    a: "That is a popular local rule, and you can play it out by hand: the last player's turn is still a normal steal on the board, so they choose any unlocked gift they want. The board records it as a steal, which is fine — the outcome is the same, and the move history stays honest.",
  },
  {
    q: "Does everyone need an account or an app?",
    a: "Nobody signs up for anything. Creating the game gives you one board link; everyone else opens that same link to watch, and one phone drives the turns. No password, no install, nothing to download on the day.",
  },
  {
    q: "What happens at the end of the game?",
    a: "Whatever each player is holding when the turn order runs out is theirs. If you added email addresses during setup, the board sends everyone one message naming the gift they ended up with and nothing else — no pairing list, no spoilers for next year.",
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
  name: "SantaWheel Dirty Santa Generator",
  alternateName: "Dirty Santa Generator",
  url: "https://santawheel.com/dirty-santa-generator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description:
    "Free Dirty Santa generator. Random turn order, open a wrapped gift or steal an opened one, with a configurable steal limit and undo on every move.",
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

export default function DirtySantaGenerator() {
  return (
    <>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Dirty Santa Generator", path: "/dirty-santa-generator" },
        ]}
      />

      {/* Above the fold */}
      <section className="mx-auto w-full max-w-2xl px-4 pb-10 pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Dirty Santa Generator
        </h1>
        <p className="mt-3 text-base text-muted">
          One pile of wrapped gifts, one random turn order, and a rule that makes
          the room shout: on your turn, open something new or take what somebody
          else already opened. A gift locks after three steals.
        </p>
        <a
          href="#create"
          className="mt-5 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
        >
          Start a Dirty Santa game
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
            Set up the game
          </h2>
          <p className="mt-2 text-sm text-muted">
            Paste the players, add gift labels if you want the board to announce
            them, and pick your steal limit. The board link is ready immediately.
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
              How Dirty Santa works
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>
                <strong className="text-foreground">Everyone drops one gift in the pile.</strong>{" "}
                Wrapped, unlabelled, and within whatever budget the group agreed
                on — ten to twenty-five dollars is typical. The pile has to match
                the headcount or the last players in the order get nothing.
              </li>
              <li>
                <strong className="text-foreground">The generator draws the turn order.</strong>{" "}
                Names come out in a random sequence, shown as numbers. The host
                can rearrange the order before the first turn and never again
                after it, so the queue is settled before anyone opens anything.
              </li>
              <li>
                <strong className="text-foreground">Every turn is a choice: open or steal.</strong>{" "}
                Turn one has to open — the pile is the only thing available.
                From turn two you can take an opened gift instead, and the person
                you took from immediately opens a new one of their own.
              </li>
              <li>
                <strong className="text-foreground">Three steals and the gift is safe.</strong>{" "}
                Each opened present shows how many times it has been taken. On
                the third steal it locks to its holder and the room moves on.
                When the order ends, whatever you are holding is yours.
              </li>
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The rules page walks through{" "}
              <Link
                href="/dirty-santa-rules"
                className="text-accent underline"
              >
                how dirty Santa stealing works
              </Link>{" "}
              in full — the freeze rule, steal chains, and the courtesy rules
              worth voting on.
            </p>
          </section>

          <section aria-labelledby="house-rules">
            <h2 id="house-rules" className="text-xl font-semibold">
              House rules groups actually use
            </h2>
            <dl className="mt-4 space-y-3 text-sm leading-relaxed">
              <div>
                <dt className="font-medium">Three steals per gift</dt>
                <dd className="text-muted">
                  The default here and the most common rule in the South. The
                  board enforces it, so no one has to remember which box has
                  already been taken twice.
                </dd>
              </div>
              <div>
                <dt className="font-medium">First player must open</dt>
                <dd className="text-muted">
                  Automatic. There is nothing opened on turn one, so the first
                  player always picks from the pile.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Last player can swap</dt>
                <dd className="text-muted">
                  A common courtesy rule. Play it on the board as a normal steal:
                  the last player takes whatever unlocked gift they want, and the
                  person they took from has already had their final turn.
                </dd>
              </div>
              <div>
                <dt className="font-medium">No stealing back immediately</dt>
                <dd className="text-muted">
                  Built in. Being robbed puts you straight back on turn with an
                  unopened gift, which keeps the same present from bouncing
                  between two players for the rest of the night.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Gag gifts allowed or banned</dt>
                <dd className="text-muted">
                  The board does not care what is in the box. If your group
                  labels gifts during setup, a joke present gets announced by
                  name, which is half the fun — and a warning for next year.
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Every family plays one detail differently. The full{" "}
              <Link
                href="/dirty-santa-rules"
                className="text-accent underline"
              >
                dirty santa rules
              </Link>{" "}
              walk through the Southern defaults, the freeze rule, and the
              variations worth voting on before the first turn. Hand out a{" "}
              <Link
                href="/dirty-santa-rules/printable"
                className="text-accent underline"
              >
                printable rules card
              </Link>{" "}
              so nobody argues about the steal cap.
            </p>
          </section>

          <section aria-labelledby="vs-white-elephant">
            <h2 id="vs-white-elephant" className="text-xl font-semibold">
              Dirty Santa vs white elephant
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The rules are the same game; the culture around them is not. White
              elephant carries the older idea of passing along a useless gift,
              which is where gag presents come from. Dirty Santa is played for the
              stealing: the room is louder, the steal limit is negotiated in
              advance, and the last player often gets a free swap. If your
              invitation says{" "}
              <Link href="/white-elephant-generator" className="text-accent underline">
                white elephant
              </Link>{" "}
              or{" "}
              <Link href="/yankee-swap-generator" className="text-accent underline">
                Yankee swap
              </Link>
              , those pages describe the same engine under the other two names —
              the board is identical.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              If there is no stealing at all, this is the wrong game. A{" "}
              <Link href="/" className="text-accent underline">
                Secret Santa draw
              </Link>{" "}
              assigns each person one name to shop for, privately, and nobody
              ever takes a gift off the table.
            </p>
          </section>

          <section aria-labelledby="for-offices">
            <h2 id="for-offices" className="text-xl font-semibold">
              Dirty Santa for offices
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Keep it to working hours and to gifts nobody has to explain to HR.
              Load the roster, set the steal cap to two, and put the board on the
              meeting-room TV: the room sees whose turn it is, what is still
              wrapped, and which presents are already locked. Anyone remote opens
              the same link and follows along. No accounts, so nobody has to hand
              over a personal email to play.
            </p>
          </section>

          <section aria-labelledby="for-families">
            <h2 id="for-families" className="text-xl font-semibold">
              Dirty Santa for family and friends
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              A family game usually needs two adjustments: a lower steal cap so
              the youngest players do not lose their gift four times, and a turn
              order that puts whoever arrives late or leaves early at the front.
              Both are one tap on the board. Pass one phone around, or leave it on
              the table between courses — the game survives screen locks, dropped
              Wi-Fi, and someone accidentally closing the tab, because every move
              is replayed from the history rather than held in memory.
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
