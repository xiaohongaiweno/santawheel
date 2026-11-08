import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: {
    absolute: "Secret Santa Gift Ideas — 30 Ideas Under $25",
  },
  description:
    "Thirty Secret Santa gift ideas for coworkers, friends and family, sorted by budget from under $10 to $25, plus what to avoid and how to write a wishlist that makes the draw easy.",
  alternates: {
    canonical: "/secret-santa-gift-ideas",
  },
  openGraph: {
    url: "/secret-santa-gift-ideas",
  },
};

// ---------- content ----------

const underTen = [
  {
    name: "Unscented hand cream",
    why: "The safest personal-care gift in a shared office: useful, consumable, and no scent to sit next to someone who is sensitive to it.",
  },
  {
    name: "A good bar of soap",
    why: "Costs a few dollars, feels considerably more expensive than it is, and nobody has to guess a size.",
  },
  {
    name: "Cozy socks",
    why: "One size covers most adults, they get worn, and a slightly silly pattern gives the gift some personality.",
  },
  {
    name: "Gourmet hot chocolate sachets",
    why: "Consumable, shareable, and seasonally correct without being a decoration that ends up in a cupboard.",
  },
  {
    name: "A desk succulent",
    why: "A plant small enough to live on a desk is hard to dislike, and it does not need a windowsill to survive a month.",
  },
  {
    name: "A tea or coffee sampler",
    why: "A tin of loose-leaf tea or a bag of whole-bean coffee lets someone try something without committing to a whole bag.",
  },
  {
    name: "Nice pens and a notebook",
    why: "An upgrade on the stationery people already use. Cheap pens are everywhere; a pen that writes well is not.",
  },
  {
    name: "A paperback",
    why: "A popular novel or a sturdy classic is a real gift rather than a token. Pick something you would read yourself.",
  },
  {
    name: "A cookie or candy tin",
    why: "The office gift that disappears fastest. Buy something with a decent shelf life and avoid anything that melts.",
  },
  {
    name: "A cable organizer or phone stand",
    why: "Small, useful, and solves a problem everyone has. It reads as thoughtful rather than generic.",
  },
];

const tenToTwenty = [
  {
    name: "An insulated tumbler",
    why: "Keeps a drink cold or hot for hours. The single most reliably welcome gift for anyone who commutes or works at a desk.",
  },
  {
    name: "A reusable coffee cup",
    why: "For the person who already buys coffee on the way in. Choose one that fits under a standard café machine.",
  },
  {
    name: "A small card game",
    why: "A deck-sized game fits a bag, works with two to six people, and gets played rather than shelved.",
  },
  {
    name: "A beanie or blanket scarf",
    why: "One size, seasonal, and genuinely useful in a cold office or on a winter walk.",
  },
  {
    name: "A portable power bank",
    why: "A 10,000 mAh bank recharges a phone twice and lives in a bag without being noticed — until it is needed.",
  },
  {
    name: "A candle with an unscented option",
    why: "A good candle is a classic gift, but scent is personal. Pick a mild one, or pair it with an unscented alternative.",
  },
  {
    name: "A proper board game",
    why: "One box, many evenings. Pick something with simple rules and a short play time so it gets to the table.",
  },
  {
    name: "A small kitchen gadget",
    why: "A mini waffle maker, milk frother or citrus press is cheap enough for the budget and gets used on a Sunday morning.",
  },
  {
    name: "A cheese board or knife set",
    why: "Reads as a housewarming gift rather than an office gift, which is exactly why people like receiving it.",
  },
  {
    name: "A hot sauce or spice set",
    why: "For anyone who cooks, a set of small bottles is more interesting than another mug — and it is easy to regift if it is not their thing.",
  },
  {
    name: "A movie-night box",
    why: "Popcorn, a chocolate bar and a pair of socks in one box. The gift is the evening, not the objects.",
  },
  {
    name: "A plant in a proper pot",
    why: "The larger version of the desk plant. Buy something described as easy to keep alive and say so on the card.",
  },
];

const twentyToTwentyFive = [
  {
    name: "A throw blanket",
    why: "The most stolen gift in every office exchange. Neutral colours survive any living room.",
  },
  {
    name: "A cast iron skillet",
    why: "A 10-inch skillet often lands inside this budget and lasts decades. It is heavy, so check the recipient is not travelling home by plane.",
  },
  {
    name: "A weighted eye mask",
    why: "A quiet, practical upgrade for anyone who sleeps badly or travels. Also easy to use at a desk on a lunch break.",
  },
  {
    name: "A digital kitchen scale",
    why: "Boring in the best way: bakers and cooks use one constantly, and most households still do not own one.",
  },
  {
    name: "A mini Bluetooth speaker",
    why: "Small enough to move between rooms, loud enough for a kitchen. Check it has a normal charging cable rather than a proprietary one.",
  },
  {
    name: "A desk lamp with a warm setting",
    why: "Useful for late work and reading. Choose one with a standard bulb or a USB-C cable so it is not disposable when a part fails.",
  },
  {
    name: "An insulated water bottle",
    why: "People who carry water already have a favourite; people who do not yet have a good one use it more than they expect.",
  },
  {
    name: "A 1000-piece puzzle",
    why: "A shared activity for the holidays that costs one box and keeps a table busy for a week.",
  },
];

const coworkerIdeas = [
  "Desk-sized plant or a good pen — works even if you only know their job title.",
  "Gourmet snacks in a sealed tin — shared, consumable, and no size or taste to guess.",
  "A cable organizer, phone stand or power bank — useful to anyone with a laptop.",
  "A reusable cup or tumbler — safe if they commute, work at a desk, or both.",
  "A small puzzle or card game — a break-time gift rather than a personal one.",
  "A nice notebook — the item people buy for work and never buy for themselves.",
];

const hasEverything = [
  "Consumables: good coffee, tea, chocolate, olive oil, spices or a candle. The gift is used up and does not add clutter.",
  "An upgrade on something they already use daily: a better pen, a sharper kitchen knife, a sturdier water bottle.",
  "An experience in a box: a puzzle, a board game, or a movie-night kit that gives them an evening rather than an object.",
  "Something local: a farmers-market food box or a craft from a nearby maker, which is harder to buy for yourself.",
];

const avoid = [
  "Cash and gift cards, unless the organizer explicitly allowed them. They read as opting out, and many groups ban them outright.",
  "Strongly scented bath sets. Scent is personal, offices often have policies, and the set usually gets regifted.",
  "Alcohol unless the group has said it is fine. Workplace rules and recovery are both real reasons to leave it out.",
  "Diet, weight-loss or fitness products. Never a good gift from a coworker you barely know.",
  "Clothing in a specific size, unless you have the size in writing.",
  "Joke gifts that are designed to be thrown away. The laugh lasts ten seconds; the object lasts longer.",
  "Anything that needs batteries, software, or assembly on the day. The recipient should not have to work for their present.",
  "Multi-level-marketing products. Even when the product is fine, the gift reads as a sales pitch.",
];

const faqs = [
  {
    q: "How much should I spend on a Secret Santa gift?",
    a: "Twenty to twenty-five dollars is the usual office range; families and friend groups often set ten to twenty. The stated budget always wins over any general figure, and going under it is fine. The one thing to avoid is quietly spending much more than everyone else.",
  },
  {
    q: "What if I do not know my recipient well?",
    a: "Buy a consumable or an upgrade on something universal: good tea or coffee, a snack tin, a tumbler, a nice pen, or a small plant. These work without knowing a size, a colour preference or a hobby. If the group uses wishlists or anonymous questions, use them first.",
  },
  {
    q: "Are gift cards allowed?",
    a: "Ask the organizer. Many groups ban them because a card is close to cash and removes the choosing; others allow them for people who are hard to buy for. If you are the organizer, put the ruling in the invitation so nobody has to guess.",
  },
  {
    q: "Should the gift be wrapped?",
    a: "Usually yes — the exchange is part of the fun. Confirm the format with the organizer: some groups prefer gift bags, and some offices ask for no wrapping paper for sustainability reasons.",
  },
  {
    q: "Is handmade or second-hand acceptable?",
    a: "Only if the group has said so. When the budget is tight, homemade jam, a knitted item or a well-kept second-hand book can be the best gift in the pile — but it needs to be an agreed option, not a surprise that makes someone feel underdressed.",
  },
  {
    q: "What should go on a Secret Santa wishlist?",
    a: "Keep it short and concrete: three sizes, two colours, a snack or drink you like, one hobby, and a short list of things you would rather not receive. That is enough for a stranger to buy something you will actually use.",
  },
  {
    q: "I need gift ideas for a white elephant game instead. Where do I look?",
    a: "White elephant is a different problem: the present has to be generic enough that anyone can take it home and good enough that someone wants to steal it. The white elephant gift ideas list covers that, and the white elephant rules explain the steal cap that shapes the pick.",
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

export default function SecretSantaGiftIdeas() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Secret Santa Gift Ideas", path: "/secret-santa-gift-ideas" },
        ]}
      />

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Secret Santa Gift Ideas
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            A Secret Santa gift has one job: make someone you may not know well
            feel considered, without blowing the budget or guessing their size.
            Thirty ideas follow, grouped by what they actually cost, plus the
            gifts that quietly go wrong and how to write a wishlist that makes
            the whole draw easier. Prices are typical US retail and move around
            — treat the groups as a guide, not a promise.
          </p>
        </section>

        <section aria-labelledby="how-to-choose">
          <h2 id="how-to-choose" className="text-xl font-semibold">
            How to pick in under a minute
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Three questions settle almost every Secret Santa decision:
          </p>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted">
            <li>
              <strong className="text-foreground">
                Would I be glad to receive this?
              </strong>{" "}
              If the honest answer is no, it is not a gift — it is a joke with
              wrapping paper. The best picks are things you would happily take
              home yourself.
            </li>
            <li>
              <strong className="text-foreground">
                Could anyone in the group use it?
              </strong>{" "}
              Secret Santa is anonymous by design. A gift that only works for
              one person&apos;s taste, size or kitchen is a gamble; a gift that
              works for most adults is a safe bet.
            </li>
            <li>
              <strong className="text-foreground">
                Does it fit the stated budget?
              </strong>{" "}
              Under is fine, over is awkward. If the group set twenty dollars,
              a twenty-two dollar gift with a handwritten note beats a
              forty-dollar gift that makes everyone else look mean.
            </li>
          </ol>
        </section>

        <section aria-labelledby="under-ten">
          <h2 id="under-ten" className="text-xl font-semibold">
            Under $10
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Small budgets produce better gifts than people expect, as long as
            the object is useful and the wrapping is not an apology.
          </p>
          <IdeaList ideas={underTen} />
        </section>

        <section aria-labelledby="ten-to-twenty">
          <h2 id="ten-to-twenty" className="text-xl font-semibold">
            $10 to $20
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            This is the sweet spot for most office exchanges: enough money to
            buy something durable, not so much that anyone feels they
            overspent.
          </p>
          <IdeaList ideas={tenToTwenty} />
        </section>

        {/* Mid-page CTA */}
        <div className="rounded-lg border border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm font-medium">
            Got the gifts sorted? The draw is the easy part — paste the list,
            add exclusions, and everyone gets their assignment privately.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
          >
            Draw Secret Santa names
          </Link>
        </div>

        <section aria-labelledby="twenty-to-twenty-five">
          <h2 id="twenty-to-twenty-five" className="text-xl font-semibold">
            $20 to $25
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            At this end of the budget, buy one good thing instead of three
            small things. A single useful object reads as more thoughtful than
            a hamper of filler.
          </p>
          <IdeaList ideas={twentyToTwentyFive} />
        </section>

        <section aria-labelledby="coworkers">
          <h2 id="coworkers" className="text-xl font-semibold">
            For coworkers you barely know
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            The less you know about someone, the more the gift should lean
            useful and impersonal. These all survive a total stranger:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {coworkerIdeas.map((idea) => (
              <li key={idea.slice(0, 24)}>{idea}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="has-everything">
          <h2 id="has-everything" className="text-xl font-semibold">
            For the person who has everything
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Buying for someone with a full house is a clutter problem, not a
            budget problem. Four directions that tend to work:
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {hasEverything.map((idea) => (
              <li key={idea.slice(0, 24)}>{idea}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="avoid">
          <h2 id="avoid" className="text-xl font-semibold">
            What to avoid
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Most Secret Santa disappointments come from a short list of
            categories. None of them are bad gifts in the right context; all of
            them are risky in an anonymous exchange.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {avoid.map((item) => (
              <li key={item.slice(0, 24)}>{item}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="wishlist">
          <h2 id="wishlist" className="text-xl font-semibold">
            Make your own wishlist short and concrete
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A wishlist is the highest-leverage thing you can do as a
            participant. Keep it to five lines: three sizes, two colours, a
            snack or drink you like, one hobby, and a short &quot;please
            no&quot; list. That is enough for someone who has never met you to
            buy something you will use, and it removes the guessing that makes
            Secret Santa stressful.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            If the group would rather not share wishlists, the same site
            supports anonymous questions and private wishlists, so your
            recipient can answer a shortlist of questions without either of you
            revealing who you are. The{" "}
            <Link href="/features" className="text-accent underline">
              features page
            </Link>{" "}
            explains how that works, and the{" "}
            <Link
              href="/secret-santa-rules"
              className="text-accent underline"
            >
              Secret Santa rules
            </Link>{" "}
            cover the budget and exclusions the wishlist sits inside.
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
            Playing the pile game instead? The{" "}
            <Link
              href="/white-elephant-gift-ideas"
              className="text-accent underline"
            >
              white elephant gift ideas
            </Link>{" "}
            cover presents that have to survive being opened and stolen in
            front of the room.
          </p>
        </section>
      </div>
    </>
  );
}
