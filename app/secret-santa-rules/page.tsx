import type { Metadata } from "next";
import Link from "next/link";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: {
    absolute: "Secret Santa Rules — How to Play, Budgets & Exclusions",
  },
  description:
    "The Secret Santa rules most groups actually use: one gift per person, a stated budget, no self-draws, exclusion pairs, private assignments, and what to do when someone drops out.",
  alternates: {
    canonical: "/secret-santa-rules",
  },
  openGraph: {
    url: "/secret-santa-rules",
  },
};

// ---------- content ----------

const steps = [
  {
    name: "Agree the budget and the exchange date",
    text: "Pick a number everyone can live with and put it in the invitation. Twenty to twenty-five dollars is the usual office range; families often go lower. The exact figure matters less than everyone using the same one.",
  },
  {
    name: "Collect the participant list",
    text: "Names are enough. Email addresses are optional — you can draw with names only and hand each person a private link, which suits families and groups who would rather not trade contact details.",
  },
  {
    name: "Draw one-to-one pairs",
    text: "Every name is drawn exactly once, so each person buys for one other person and receives from one other person. Nobody draws themselves, and any exclusion pairs you add are respected in both directions.",
  },
  {
    name: "Send each person their assignment privately",
    text: "Email works for most groups. Private links work for the rest: one unguessable link per person, sent in a one-to-one message rather than a group chat. The organizer can also use blind mode so the dashboard never shows the pairings.",
  },
  {
    name: "Keep it secret until the exchange",
    text: "The assignment is the surprise. Do not tell the person you drew, do not confirm guesses, and do not post the pairing list anywhere the group can see it. Reveal happens at the exchange, not before.",
  },
];

const coreRules = [
  "One gift per person, one recipient per person. The draw is a single loop: everyone gives once and receives once.",
  "Nobody draws their own name. A valid draw never produces a self-pairing, and an online generator should refuse to return one.",
  "The budget is stated in advance and applies to everyone. If it is not written down, someone will spend sixty dollars and someone will spend ten.",
  "Exclusions are agreed before the draw, not after. Couples, roommates, siblings and a manager and their direct reports are the usual pairs.",
  "The assignment stays private. The person who drew a name is the only one who should know it until the exchange.",
  "Everyone in the draw is also a giver. If someone opts out of receiving, they should opt out of the draw entirely so the loop stays closed.",
];

const houseRules = [
  {
    name: "Say whether gift cards are allowed",
    body: "Many groups ban them outright because a card is close to cash and takes the choosing out of the gift. Others allow them. Either ruling is fine — an unstated one is not.",
  },
  {
    name: "Say whether handmade or second-hand is allowed",
    body: "If the budget is tight for some people, homemade, thrifted or regifted presents can level the field. Say so in the invite so nobody overspends to keep up and nobody feels caught out.",
  },
  {
    name: "Ask for a wishlist, but keep it optional",
    body: "Three sizes, two colours, a snack they like, a hobby, and a short 'please no' list is enough for a stranger to buy well. A wishlist is guidance, not a shopping order.",
  },
  {
    name: "Name the exchange something everyone can join",
    body: "If the group is not all Christmas, call it a holiday gift exchange and let people opt out without being put on the spot. An opt-out is a participant who does not take part at all — not someone who stays in the draw but does not celebrate.",
  },
];

const problems = [
  {
    q: "Someone drops out after the draw",
    a: "Redraw. A one-to-one loop cannot absorb a missing person: whoever was buying for them is now buying for nobody, and their own giver is left without a recipient. A redraw discards the old pairings and invalidates every link already sent, which is exactly what you want.",
  },
  {
    q: "Someone never received their assignment",
    a: "Check spam first, then resend from the organizer dashboard or send their private link a second time by message. Do not read the assignment out to a third person as a workaround — that is how secrets leak.",
  },
  {
    q: "The organizer does not want to know the pairings",
    a: "Use blind mode. The dashboard still shows delivery status and lets you resend, but the pairings are never displayed and cannot be exported. Useful when the organizer is also playing and would rather not carry the answer around all week.",
  },
  {
    q: "Someone wants to join late",
    a: "Before the draw: add them and draw once. After the draw: redraw, because adding one person breaks the loop and requires new pairings for two other people as well.",
  },
  {
    q: "Two people should not draw each other",
    a: "Add an exclusion pair. It applies both ways. Be aware of the limit: with only two participants and an exclusion between them, no valid draw exists at all — one of them must draw the other. A generator should say so instead of returning a broken result.",
  },
  {
    q: "The budgets come out lopsided",
    a: "Restate the number in the group message, not just the invitation. If it keeps happening, switch to a wishlist with a price ceiling written on it, or move the group to a white elephant exchange, where the pile is visible and the budget is easier to police.",
  },
];

const faqs = [
  {
    q: "How many people do you need for Secret Santa?",
    a: "Three is the practical minimum for the game to feel like a draw. Two works only if the pair is allowed to draw each other — which means each person knows exactly who has them, so the secrecy is gone. There is no upper limit that matters; groups of fifty run fine online.",
  },
  {
    q: "Can someone draw themselves?",
    a: "No. A valid draw is a one-to-one pairing with no self-pairs. If you draw with paper slips, check the result before announcing it; if you use a generator, it should validate the pairing before saving it.",
  },
  {
    q: "Do participants need an email address?",
    a: "No. Email is the easiest delivery method, but names alone are enough. In private-link mode you get one link per person and send it yourself by WhatsApp, SMS or however the group already talks.",
  },
  {
    q: "Can couples or coworkers be kept apart?",
    a: "Yes. Add exclusion pairs and the draw respects them in both directions, so a couple never draws each other and neither does a manager and their direct report. Exclusions can make a draw impossible in very small groups; the generator reports that instead of producing a bad pairing.",
  },
  {
    q: "Who should not be in the draw?",
    a: "Anyone who has opted out, and anyone who would feel obliged rather than included. A Secret Santa works because everyone is a giver and a receiver; a person who only receives breaks the loop. Ask once, accept the answer, and draw with the remaining group.",
  },
  {
    q: "How far ahead should we draw?",
    a: "Two to three weeks before the exchange is comfortable: enough time to shop, order online, and recover from a late change. Drawing the night before pushes everyone into whatever is left on the shelf.",
  },
  {
    q: "Is a Secret Santa the same as a white elephant?",
    a: "No, and the difference decides which one your group wants. Secret Santa is a hidden one-to-one pairing: you buy for one person and nobody knows who has you. White elephant is a pile game played in the open, with a fixed turn order and stealing. If presents are meant to be opened and stolen in the room, use the white elephant rules instead.",
  },
  {
    q: "Is an online draw actually random?",
    a: "A good one is. SantaWheel generates the pairing from a cryptographically secure random source, checks it against every rule, and saves it only if the result is valid. Redrawing produces a genuinely new pairing rather than the same one reshuffled.",
  },
];

// ---------- structured data ----------

const howtoJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to run a Secret Santa gift exchange",
  description:
    "The standard Secret Santa rules: agree a budget, collect the group, draw one-to-one pairs with no self-draws, send assignments privately, and keep them secret until the exchange.",
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

export default function SecretSantaRules() {
  return (
    <>
      <JsonLd data={howtoJsonLd} />
      <JsonLd data={faqJsonLd} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Secret Santa Rules", path: "/secret-santa-rules" },
        ]}
      />

      <div className="mx-auto max-w-2xl space-y-10 px-4 py-12">
        <section>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Secret Santa Rules
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Secret Santa has fewer rules than white elephant, and the handful it
            does have are the ones groups get wrong: an unstated budget, an
            exclusion agreed too late, a pairing list leaked in the group chat.
            Here is the rule set to read out before the draw, the house rules
            worth adding, and what to do when the plan breaks. When the rules
            are settled, you can{" "}
            <Link href="/" className="text-accent underline">
              draw the names online
            </Link>{" "}
            in one click.
          </p>
        </section>

        <section aria-labelledby="how-it-works">
          <h2 id="how-it-works" className="text-xl font-semibold">
            How a Secret Santa draw works, step by step
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
            The rules most groups actually use
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Six defaults cover almost every office, family and friends&apos;
            exchange. Wording varies; the substance does not.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
            {coreRules.map((r) => (
              <li key={r.slice(0, 24)}>{r}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="budget">
          <h2 id="budget" className="text-xl font-semibold">
            Budget: the one number to write down
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Twenty to twenty-five dollars is the usual office range; families
            and friend groups often set ten to twenty. Whatever you choose,
            print it in the invitation and repeat it in the group message a
            week before the exchange. A stated budget is a rule; an implied one
            is a competition.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Two details make the number work in practice. First, say whether
            going under budget is fine — it always is, and people need
            permission to hear it. Second, point people at a{" "}
            <Link
              href="/secret-santa-gift-ideas"
              className="text-accent underline"
            >
              list of Secret Santa gift ideas
            </Link>{" "}
            sorted by price, so the people who hate shopping have somewhere to
            start.
          </p>
        </section>

        <section aria-labelledby="exclusions">
          <h2 id="exclusions" className="text-xl font-semibold">
            Exclusion rules: decide before the draw
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Exclusions are the pairs who must not draw each other: partners,
            spouses, roommates, siblings who already buy for each other every
            year, and a manager and their direct reports. Collect them before
            the draw, apply them in both directions, and do not accept new ones
            after the result is out.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            There is one hard limit worth knowing: two participants with an
            exclusion between them cannot be drawn at all, because the only
            possible pairing is each other. A generator should report that
            clearly rather than returning a pairing that breaks the rule.
          </p>
        </section>

        {/* Mid-page CTA */}
        <div className="rounded-lg border border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm font-medium">
            Rules settled? Paste the list and the draw takes a second — with
            exclusions applied and every assignment sent privately.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-12 items-center rounded-lg bg-accent px-6 text-base font-semibold text-surface transition-colors hover:bg-accent-strong"
          >
            Draw Secret Santa names
          </Link>
        </div>

        <section aria-labelledby="house-rules">
          <h2 id="house-rules" className="text-xl font-semibold">
            House rules worth adding
          </h2>
          <dl className="mt-4 space-y-3 text-sm leading-relaxed">
            {houseRules.map((h) => (
              <div key={h.name}>
                <dt className="font-medium">{h.name}</dt>
                <dd className="mt-1 text-muted">{h.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="delivery">
          <h2 id="delivery" className="text-xl font-semibold">
            Delivering the assignments without leaking them
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Email is the default and the safest for a group that checks its
            inbox: each person receives their own message, and nobody sees
            anyone else&apos;s. Private links are the alternative for groups who
            do not want to share email addresses — one link per person, sent
            individually. What you should never do is paste the pairing list
            into a group chat, screenshot the organizer dashboard, or
            &quot;helpfully&quot; tell someone who they have.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            If the organizer is also playing and would rather not be trusted
            with the answer, blind mode keeps the pairings out of the dashboard
            entirely. Delivery status and resend still work; the names do not
            appear.
          </p>
        </section>

        <section aria-labelledby="problems">
          <h2 id="problems" className="text-xl font-semibold">
            What goes wrong, and how to settle it
          </h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed">
            {problems.map((p) => (
              <div key={p.q}>
                <h3 className="font-medium">{p.q}</h3>
                <p className="mt-1 text-muted">{p.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="vs-white-elephant">
          <h2 id="vs-white-elephant" className="text-xl font-semibold">
            Secret Santa vs white elephant
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A Secret Santa is quiet: one hidden pairing, one gift each, no
            stealing, and the surprise is who drew whom. A white elephant
            exchange is loud: one pile in the middle of the room, a fixed turn
            order, and every present opened in front of everyone — with
            stealing as the entertainment. If the second description fits your
            party, read the{" "}
            <Link
              href="/white-elephant-rules"
              className="text-accent underline"
            >
              white elephant rules
            </Link>{" "}
            instead. The same site runs both, and the{" "}
            <Link
              href="/gift-exchange-generator"
              className="text-accent underline"
            >
              gift exchange generator
            </Link>{" "}
            covers draws that are neither.
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
