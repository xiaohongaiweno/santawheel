import type { Metadata } from "next";
import Link from "next/link";
import CreateGameForm from "@/components/we/CreateGameForm";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: { absolute: "White Elephant Generator – Free Online Gift Exchange Draw" },
  description:
    "White elephant generator: random picking order, open a present or steal an opened one, with a cap on repeat steals. Free, no sign-up, runs on one phone.",
  alternates: {
    canonical: "/white-elephant-generator",
  },
  openGraph: {
    url: "/white-elephant-generator",
  },
};

// ---------- structured data ----------

const faqs = [
  {
    q: "Does everyone have to bring a gift?",
    a: "Yes. One wrapped gift per person keeps the pile the same size as the group, so nobody is left empty-handed at the end. You can type the gifts in as labels when you set up the game, or leave that field empty and they become Gift 1, Gift 2, and so on.",
  },
  {
    q: "How many times can one gift be stolen?",
    a: "Three times by default. The organizer can change that from 0 to 10 before or during the game. Once a gift reaches the limit it locks, shows as locked on the board, and can never be taken again.",
  },
  {
    q: "Can I steal back the gift I just lost?",
    a: "No. Whoever was stolen from is up again immediately and has to open a new gift from the pile. That single rule is what stops two people bouncing the same present back and forth for ten minutes.",
  },
  {
    q: "How many people do I need?",
    a: "Two is enough for the rules to work, though a real exchange usually runs with six to fifteen. The board handles up to 100 players and one gift each.",
  },
  {
    q: "Do participants need an account?",
    a: "Nobody signs up — there is no account, no password, and no app. Setting up the game gives you a single board link; everyone else opens that same link to watch, and the person holding it drives the game.",
  },
  {
    q: "How does it work on a phone?",
    a: "Open the board link on one phone and pass it around, or cast it to a screen. Tap a gift to open it, tap a player to steal from them, and the board updates for everyone after each move. Refreshing never loses progress: the whole game is rebuilt from the move history.",
  },
  {
    q: "Is it free?",
    a: "Yes. Creating a game, running the board, undo, and the result emails are all free, with no card and no trial.",
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
  name: "SantaWheel White Elephant Generator",
  alternateName: "White Elephant Generator",
  url: "https://santawheel.com/white-elephant-generator",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  description:
    "Free white elephant generator. Give the group a random picking order, then open a wrapped gift or steal an opened one, with a configurable cap on repeat steals.",
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

export default function WhiteElephantGenerator() {
  return (
    <>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "White Elephant Generator", path: "/white-elephant-generator" },
        ]}
      />

      {/* Above the fold */}
      <section className="mx-auto w-full max-w-2xl px-4 pb-10 pt-8 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          White Elephant Generator
        </h1>
        <p className="mt-3 text-base text-muted">
          Everyone picks in a fixed order: open a wrapped present from the pile, or
          steal one that has already been opened. No gift can be stolen more than
          three times — change the cap if your group likes it rougher.
        </p>
        <a
          href="#create"
          className="mt-5 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
        >
          Start a white elephant draw
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
            Paste the group, add the presents if you want them named, and pick how
            often one gift may be stolen. You get a board link straight away.
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
              How White Elephant works
            </h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
              <li>
                <strong className="text-foreground">Everyone brings one gift.</strong>{" "}
                Paste your group and the presents, and the generator shuffles a
                picking order. The organizer can move people up or down before the
                first turn; after that the order is fixed so nobody argues about it
                mid-game.
              </li>
              <li>
                <strong className="text-foreground">Take turns at the board.</strong>{" "}
                On your turn you either open an unopened gift from the pile or steal
                one somebody has already opened. Whoever you steal from plays again
                immediately and has to open a new gift — stealing the same present
                back is not allowed, which is what keeps the game moving.
              </li>
              <li>
                <strong className="text-foreground">Stop when the turns run out.</strong>{" "}
                Whatever people are holding is the final result. If you added email
                addresses, the board sends each player one message saying what they
                ended up with — no names, no sneaking a look at the pile.
              </li>
            </ol>
          </section>

          <section aria-labelledby="vs-secret-santa">
            <h2 id="vs-secret-santa" className="text-xl font-semibold">
              White Elephant vs Secret Santa
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              They are opposites, and the difference decides which one your group
              actually wants. A Secret Santa is a hidden pairing: everyone is
              matched to one person, buys a gift for them, and nobody knows who drew
              their name — the gift is the surprise. A white elephant exchange keeps
              the presents in the middle of the room and plays it out loud: everyone
              sees the pile, picking happens in a fixed order, and stealing is the
              entertainment. If the secrecy is the part your group likes, use the{" "}
              <Link href="/" className="text-accent underline">
                Secret Santa Generator
              </Link>{" "}
              instead — same site, one-to-one draw, gift ideas and anonymous
              questions included.
            </p>
          </section>

          <section aria-labelledby="other-names">
            <h2 id="other-names" className="text-xl font-semibold">
              Yankee swap and Dirty Santa are the same game
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The name changes with the zip code, the rules do not. New England
              calls it a yankee swap, the South and Midwest usually call it dirty
              Santa, and both mean this: one wrapped pile, a fixed turn order, and
              stealing instead of pairing people up. Use the page that matches
              your invitation —{" "}
              <Link href="/yankee-swap-generator" className="text-accent underline">
                yankee swap generator
              </Link>{" "}
              or{" "}
              <Link href="/dirty-santa-generator" className="text-accent underline">
                dirty Santa generator
              </Link>{" "}
              — and you get this same board with the local etiquette spelled out.
            </p>
          </section>

          <section aria-labelledby="custom-rules">
            <h2 id="custom-rules" className="text-xl font-semibold">
              Rules you can customize
            </h2>
            <dl className="mt-4 space-y-3 text-sm leading-relaxed">
              <div>
                <dt className="font-medium">How often a gift can be stolen</dt>
                <dd className="text-muted">
                  Three by default, adjustable from 0 to 10. At the limit the gift
                  locks: it stays with its last holder and cannot be taken again. Set
                  it to 0 for a straight pick-only round.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Whether stealing back is allowed</dt>
                <dd className="text-muted">
                  Off, deliberately. The person you took from opens a new gift
                  straight away, so the same present cannot ping-pong between two
                  players for the whole game.
                </dd>
              </div>
              <div>
                <dt className="font-medium">The picking order</dt>
                <dd className="text-muted">
                  Random by default, and the organizer can set it by hand before the
                  draw starts — useful when someone has to leave early. After the
                  first turn it is locked, so the order cannot be gamed.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Undo</dt>
                <dd className="text-muted">
                  Any move can be taken back, one at a time, and replayed. Mis-taps
                  on a phone screen are the normal case, not the exception.
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Want the full picture before you tweak anything? These{" "}
              <Link
                href="/white-elephant-rules"
                className="text-accent underline"
              >
                white elephant gift exchange rules
              </Link>{" "}
              walk through the game step by step, what each default is for,
              and what every variation does to the pacing.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Shopping for the pile? The{" "}
              <Link
                href="/white-elephant-gift-ideas"
                className="text-accent underline"
              >
                white elephant gift ideas
              </Link>{" "}
              list is organised around what actually gets stolen, with a
              budget range for each pick.
            </p>
          </section>

          <section aria-labelledby="for-offices">
            <h2 id="for-offices" className="text-xl font-semibold">
              For offices
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              An office swap has a fixed room, a fixed hour, and a wide spread of
              enthusiasm. Put the board on a laptop or the meeting-room screen and
              let the room watch while one person taps: the current player, every
              gift still in the pile, and how many times each present has been stolen
              are all on one page. The steal cap keeps the last ten minutes from
              turning into a tug of war, and undo covers the inevitable wrong tap.
              Nobody needs an account or an install, which matters when half the team
              is remote.
            </p>
          </section>

          <section aria-labelledby="for-families">
            <h2 id="for-families" className="text-xl font-semibold">
              For families
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Family exchanges usually span three generations, at least one language
              gap, and one person who will not install anything. There is nothing to
              install here: the board is a web page, one phone drives it, and the
              rest of the table just watches. Turn the steal cap down — or to zero —
              when younger players are involved, and reorder the queue so whoever
              has to leave early goes first. Everything is rebuilt from the move
              history, so a dropped connection or a locked screen loses nothing.
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
