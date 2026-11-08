import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: {
    absolute: "White Elephant Gift Ideas — 25 Gifts That Get Stolen",
  },
  description:
    "White elephant gift ideas that actually get stolen: useful, generic gifts from $10 to $25, funny options that still get used, and the presents that stall the game.",
  alternates: {
    canonical: "/white-elephant-gift-ideas",
  },
  openGraph: {
    url: "/white-elephant-gift-ideas",
  },
};

// ---------- content ----------

const underFifteen = [
  {
    name: "An insulated tumbler",
    why: "Useful to almost every adult, durable, and easy to carry home. The safest possible first pick for a group you do not know.",
  },
  {
    name: "A fuzzy throw blanket",
    why: "Discount stores sell them inside this budget, and a blanket is the most reliably stolen object in any pile.",
  },
  {
    name: "A gourmet popcorn tin",
    why: "Large, cheerful, shareable, and consumable — nobody has to find shelf space for it after the game.",
  },
  {
    name: "A proper card game",
    why: "A deck-sized game works for a family table or a bar. It is a real present rather than a gag.",
  },
  {
    name: "A 500 or 1000-piece puzzle",
    why: "Cheap, universal, and something the whole room can picture using. Puzzles also survive being stolen four times.",
  },
  {
    name: "A scented candle",
    why: "A classic steal target. Pick a mild scent, and warn the room if the group includes anyone scent-sensitive.",
  },
  {
    name: "A box of good chocolate",
    why: "The present people are happiest to receive and least likely to open in front of everyone. Check the expiry date.",
  },
  {
    name: "A hot sauce or spice set",
    why: "Small bottles of something interesting beat another novelty mug. Good for cooks, easy to regift otherwise.",
  },
  {
    name: "Cozy socks or a beanie",
    why: "One size, seasonal, and immediately useful. A silly pattern gives the steal something to talk about.",
  },
  {
    name: "A desk succulent",
    why: "A plant that fits on a windowsill or desk is hard to turn down, and it makes the pile look less like a supermarket run.",
  },
  {
    name: "A mini toolkit",
    why: "A small household tool set looks boring until someone needs a screwdriver. One of the most stolen gifts in an office pile.",
  },
  {
    name: "A phone stand or cable organizer",
    why: "Small, cheap, and useful to anyone with a desk. Reads as thoughtful rather than filler.",
  },
  {
    name: "A jar of local honey",
    why: "Consumable, generic, and considerably nicer than the price suggests. Pick a plain jar rather than a novelty gift set.",
  },
];

const fifteenToTwentyFive = [
  {
    name: "A mini Bluetooth speaker",
    why: "One of the few cheap electronics that people keep using. Check it charges over USB-C rather than a cable nobody owns.",
  },
  {
    name: "A portable power bank",
    why: "A 10,000 mAh bank is useful to absolutely everyone and looks like a considered gift rather than a stocking filler.",
  },
  {
    name: "A cast iron skillet",
    why: "Heavy, durable, and often inside this budget. The best 'boring' gift in the pile, and one people genuinely steal.",
  },
  {
    name: "A weighted eye mask",
    why: "Quietly luxurious, easy to use, and unusual enough to draw a steal or two without being personal.",
  },
  {
    name: "A board game",
    why: "A real box game at this price is a whole evening. Pick one with simple rules so it gets played that week.",
  },
  {
    name: "A coffee or tea gift set",
    why: "Consumable, shareable and hard to get wrong — provided you choose something plain rather than a flavoured novelty.",
  },
  {
    name: "Olive oil and balsamic",
    why: "Reads as an adult gift, costs about the same as a nice bottle of wine, and does not collide with anyone's alcohol policy.",
  },
  {
    name: "A mini waffle maker",
    why: "A one-job kitchen gadget that people actually use on weekends. Cheap enough to be funny, useful enough to be stolen.",
  },
  {
    name: "An herb garden kit",
    why: "A pot, seeds and instructions in one box. Works for a kitchen windowsill and gives the gift a second life after the game.",
  },
  {
    name: "A throw blanket in a neutral colour",
    why: "The upgraded version of the cheap blanket: bigger, softer, and the item most likely to be stolen three times and locked.",
  },
  {
    name: "A desk lamp with a warm setting",
    why: "Useful for late work and reading, and easy to move around. Check it uses a standard bulb or a USB-C cable.",
  },
  {
    name: "An insulated water bottle",
    why: "Hard to get wrong and used daily. Choose a neutral colour rather than a club or company logo.",
  },
];

const funnyIdeas = [
  "A giant mug — funny at first glance, genuinely useful by the second.",
  "Silly socks in a serious box, so the joke is the wrapping rather than the object.",
  "An emergency desk kit: lint roller, stain remover, plasters and a nail file in a small tin.",
  "A jar of something absurd but real — a very large jar of pickles, a tin of very strong mints.",
  "A practical item wrapped badly on purpose: a power bank inside three boxes and a layer of newspaper.",
  "A framed print of something ridiculous that is still worth hanging — a map, a cartoon, a terrible photo of the office.",
];

const mostStolen = [
  "Throw blankets, every time. Soft beats funny in every office exchange.",
  "Chocolate and snack tins. The pile gets quieter for ten minutes after one is opened.",
  "Bluetooth speakers and power banks. Small electronics are the modern steal target.",
  "Candles and cast iron. Useful, neutral, and hard to argue with.",
  "Board games and puzzles. The gift that promises a better evening than whatever was in the pile.",
  "Hot sauce and coffee sets. Consumables with personality get taken by whoever cooks.",
];

const avoid = [
  "Cash and gift cards, if the group banned them. A fifty-dollar bill ends the game in one move.",
  "Very personal items: clothing in a size, diet products, anything that comments on someone's body or habits.",
  "Strongly scented sets, bath bombs or perfumes. Scent is personal and offices often have policies.",
  "Alcohol unless the group has explicitly allowed it. Workplace rules and recovery are both reasons to leave it out.",
  "Fragile, oversized or awkward objects. Someone has to carry it home on a bus.",
  "Gag gifts built to be thrown away. The room laughs once and then the object becomes the organizer's problem.",
  "Anything requiring batteries, assembly or an account. The recipient should not have to work for the present.",
  "Live pets, obviously. This comes up more often than it should.",
];

const faqs = [
  {
    q: "What makes a good white elephant gift?",
    a: "Three things: generic enough that anyone can take it home, useful enough that someone wants to steal it, and cheap enough that nobody feels awkward. A twenty-dollar blanket beats a forty-dollar personal item because the blanket can end up with anyone in the room.",
  },
  {
    q: "How much should I spend on a white elephant gift?",
    a: "Twenty to twenty-five dollars is the usual office range, and ten to fifteen is common among friends and families. The invite should state a cap; if it does not, ask before you buy. Spending much more than the cap turns a game into a competition.",
  },
  {
    q: "Should the gift be funny or useful?",
    a: "Useful with a funny presentation is the winning combination. Pure gag gifts get a laugh during the opening and then sit in the pile while nobody steals them, which slows the game down. Present a normal, useful object absurdly and you get both.",
  },
  {
    q: "Which gifts get stolen the most?",
    a: "Blankets, chocolate, speakers, power banks, candles and board games. The pattern is consistent: soft, edible, or genuinely useful beats clever. If you want your gift to be stolen, buy something you would take home yourself.",
  },
  {
    q: "Can I regift something?",
    a: "Yes, if it is new, unused and genuinely fits the group. Nobody needs to know where it came from. Do not regift something obviously used, personal, or branded with a company that is not in the room.",
  },
  {
    q: "Does the gift need to be wrapped?",
    a: "Yes, and identically to everyone else&apos;s. Uniform wrapping keeps the pile anonymous and stops the room from guessing who brought what. No name tags, no gift bags that reveal the contents, no shape that gives the game away.",
  },
  {
    q: "What is the one gift to avoid?",
    a: "Cash. It ends the game: nobody plays a stealing game when the best move is to take the envelope and hand it back. Gift cards are the same problem in slower motion, which is why many groups ban both.",
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

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface Idea {
  name: string;
  why: string;
}

function IdeaList({ ideas }: { ideas: Idea[] }) {
  return (
    <ul className="mt-4 space-y-3 text-sm leading-relaxed">
      {ideas.map((idea) => (
        <li key={idea.name}>
          <span className="font-medium">{idea.name}</span>
          <span className="text-muted"> — {idea.why}</span>
        </li>
      ))}
    </ul>
  );
}

export default function WhiteElephantGiftIdeas() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          {
            name: "White Elephant Gift Ideas",
            path: "/white-elephant-gift-ideas",
          },
        ]}
      />

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            White Elephant Gift Ideas
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            A white elephant gift is not really a present for a person — it is
            an object that enters a game. It has to be good enough that someone
            wants to steal it, generic enough that anyone in the room could
            take it home, and cheap enough that nobody feels awkward holding
            it. That combination is narrower than it sounds, which is why so
            many piles end up with three scented candles and a novelty mug.
            These twenty-five ideas clear the bar, sorted by what they cost.
          </p>
        </section>

        <section aria-labelledby="test">
          <h2 id="test" className="text-xl font-semibold">
            The steal-worthy test
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Before you pay for anything, run three questions:
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
            <li>
              <strong className="text-foreground">
                Would at least two people in the room want it?
              </strong>{" "}
              If only one person could use it, it will sit in the pile and
              stall the game.
            </li>
            <li>
              <strong className="text-foreground">
                Could any adult in the group take it home?
              </strong>{" "}
              No sizes, no allergies, no dietary assumptions, no fragile parts.
            </li>
            <li>
              <strong className="text-foreground">
                Would you be happy to end up with it?
              </strong>{" "}
              The person who opens it last had no choice. If the answer is no,
              it is not a gift.
            </li>
          </ol>
        </section>

        <section aria-labelledby="under-fifteen">
          <h2 id="under-fifteen" className="text-xl font-semibold">
            Under $15
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Small budgets are fine in a white elephant game, as long as the
            gift is honest about it: nothing fragile, nothing half-used, and no
            wrapping that promises more than the box contains.
          </p>
          <IdeaList ideas={underFifteen} />
        </section>

        <section aria-labelledby="fifteen-to-twenty-five">
          <h2 id="fifteen-to-twenty-five" className="text-xl font-semibold">
            $15 to $25
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This is the range where the best white elephant gifts live: one
            solid object, no filler, and enough quality that the third person
            to hold it still wants it.
          </p>
          <IdeaList ideas={fifteenToTwentyFive} />
        </section>

        {/* Mid-page CTA */}
        <div className="rounded-lg border border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm font-medium">
            Gifts sorted? The board handles the order, the steal count and the
            lock — one phone drives the whole game.
          </p>
          <Link
            href="/white-elephant-generator"
            className="mt-4 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
          >
            Start a white elephant game
          </Link>
        </div>

        <section aria-labelledby="funny">
          <h2 id="funny" className="text-xl font-semibold">
            Funny gifts that still get used
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The trick is to make the joke part of the presentation and the
            usefulness part of the object. Six that work:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {funnyIdeas.map((idea) => (
              <li key={idea.slice(0, 24)}>{idea}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="most-stolen">
          <h2 id="most-stolen" className="text-xl font-semibold">
            The gifts that always get stolen
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Across offices, families and friend groups, the same categories
            keep coming back. If your goal is to be the gift everyone fights
            over, start here:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {mostStolen.map((item) => (
              <li key={item.slice(0, 24)}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="avoid">
          <h2 id="avoid" className="text-xl font-semibold">
            What to avoid
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The fastest way to slow a white elephant game down is a pile full
            of presents nobody wants to steal. These eight categories do it
            reliably:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {avoid.map((item) => (
              <li key={item.slice(0, 24)}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="steal-cap">
          <h2 id="steal-cap" className="text-xl font-semibold">
            Let the steal cap shape the pick
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            If your group plays with a high cap — three steals or more — buy
            something durable and desirable, because the gift may change hands
            repeatedly and has to survive being carried around the room.
            Consumables work well here: chocolate, coffee, hot sauce. If the
            cap is low, or set to zero for a pick-in-order round, buy something
            safe and universally liked instead. A cheap novelty item only
            works when nobody is allowed to take it off you.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The{" "}
            <Link
              href="/white-elephant-rules"
              className="text-accent underline"
            >
              white elephant rules
            </Link>{" "}
            explain the steal cap and the lock rule in detail. For regional
            names of the same game, the{" "}
            <Link
              href="/yankee-swap-rules"
              className="text-accent underline"
            >
              yankee swap rules
            </Link>{" "}
            and{" "}
            <Link
              href="/dirty-santa-rules"
              className="text-accent underline"
            >
              dirty Santa rules
            </Link>{" "}
            cover the local variations.
          </p>
        </section>

        <section aria-labelledby="wrapping">
          <h2 id="wrapping" className="text-xl font-semibold">
            Wrapping matters more than you think
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The pile has to look uniform for the game to be fair: same paper,
            same size, no name tags, and nothing that reveals a shape through
            the wrapping. If the group uses gift bags, use one that hides the
            contents. A gift that is obviously a bottle or obviously a
            houseplant gets picked for the wrong reason, and the room stops
            playing the game and starts playing the guessing game.
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
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Buying for a hidden one-to-one pairing instead? The{" "}
            <Link
              href="/secret-santa-gift-ideas"
              className="text-accent underline"
            >
              Secret Santa gift ideas
            </Link>{" "}
            are a different problem: the gift is personal, the recipient is
            known, and the budget is the only constraint you share with the
            group.
          </p>
        </section>
      </div>
    </>
  );
}
