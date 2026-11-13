# SantaWheel

Free online Secret Santa / gift exchange generator — [santawheel.com](https://santawheel.com)

No sign-up, works in the browser on mobile and desktop, up to 100 participants: paste your participant list and get a valid draw in one click — nobody draws themselves, exclusion rules apply in both directions, and every participant receives a private link showing only their own assignment.

English | [简体中文](./README.zh-CN.md)

## Features

- **One-click draw**: paste your list and get valid pairs — no self-draws, no duplicates, with redraw protection
- **Exclusion rules**: keep couples, roommates, or managers and reports apart; rules apply in both directions, and unsolvable rule conflicts are reported clearly instead of producing a broken draw
- **Multiple delivery methods**: automatic email, private links (share via WhatsApp/SMS — no email needed), or self-join links
- **Privacy**: blind mode hides pairings even from the organizer; anonymous Q&A (sizes, preferences) the organizer cannot see
- **Wishlists**: participants can add gift wishes and a shipping address, visible only to whoever drew them
- **White elephant mode**: White Elephant / Yankee Swap / Dirty Santa with an automatic opening and stealing order (including the 3-steal lock rule)
- **Scheduled draws**: set a draw time in advance, cancel it, or draw manually anytime

## The Complete Rules

The rules below match the site pages [Secret Santa Rules](https://santawheel.com/secret-santa-rules), [White Elephant Rules](https://santawheel.com/white-elephant-rules), [Yankee Swap Rules](https://santawheel.com/yankee-swap-rules), and [Dirty Santa Rules](https://santawheel.com/dirty-santa-rules).

### Secret Santa rules

How it works: everyone anonymously prepares a gift for one other person, decided by a draw.

1. **Agree on a budget in advance**: put the number in the invite and it applies to everyone. Without a written number, someone spends sixty dollars and someone spends ten.
2. **Collect the group**: three people is the practical minimum; a two-person draw has no secrecy. Anyone who opts out of receiving should opt out of the draw entirely to keep the loop closed.
3. **Agree on exclusions before the draw**: couples, roommates, siblings, and manager/direct-report pairs should not draw each other. Exclusions apply in both directions; in extreme cases they can make a draw impossible, and the tool reports that instead of returning an invalid result.
4. **Draw one-to-one pairs**: every name is drawn exactly once, so each person buys for one other person and receives from one other person. Nobody draws themselves.
5. **Send assignments privately**: by email, via private links (one unguessable link per person), or via self-join links. Organizers who do not want to know the pairings can turn on blind mode.
6. **Keep it secret until the exchange**: the assignment is the surprise. Do not tell the person you drew, do not confirm guesses, do not post the pairing list anywhere the group can see it.

Common fixes: someone drops out after the draw → redraw and invalidate old links; someone never received their assignment → resend from the dashboard, never read it out loud; late joiner → add before the draw, redraw if the draw already happened.

### White Elephant / Yankee Swap / Dirty Santa rules

How it works: everyone brings one wrapped, unlabelled gift to one pile, and players take turns in a fixed order, choosing to "unwrap a new gift or steal an opened one." The three names are the same game (Yankee Swap in New England, Dirty Santa in the South, White Elephant most everywhere else); the main difference is the freeze rule.

Basic flow:

1. **Everyone brings one gift**: the pile must match the headcount, the host sets the budget in the invite (commonly $15–25), new gifts only, nothing perishable or alive.
2. **Draw a random order**: the order is set before the first turn and locked after that.
3. **The first player can only unwrap**: there is nothing to steal yet, so turn one opens a present from the pile and shows it around.
4. **Each turn is a choice**: unwrap a new gift, or steal any opened one. Whoever is stolen from immediately unwraps a new gift from the pile.
5. **Steals are capped**: White Elephant's default locks a gift after it has been stolen 3 times, and it stays with its final holder; Dirty Santa's default Southern rule freezes a gift the moment it is first stolen — it can never be stolen again.
6. **No stealing straight back**: a gift that was just taken from you cannot be taken back on your next turn.
7. **The game ends when the pile is empty**: whatever you are holding is yours, and there is no trading afterwards.

Common variants: steal cap set to 0 (a straight pick-in-order draw for kids); one steal per turn; gag-gift rounds; a freeze limit of two moves instead of one.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- Supabase Postgres for storage (`supabase/migrations/`)
- Resend for email delivery, with a retry queue
- Waffo Pancake for the one-time $4.99 premium unlock
- Deployed on Vercel

## Pages

| Route | Purpose |
|---|---|
| `/` | Secret Santa generator (primary landing page) |
| `/gift-exchange-generator` | Gift exchange generator (isolated copy, own keyword) |
| `/a/[token]` | Participant reveal page — signed token, shows only own pairing |
| `/manage/[token]` | Organizer dashboard — delivery status, resend, CSV, redraw, premium |
| `/remove/[token]` | GDPR data removal |

## Draw engine

`lib/draw/derangement.ts` — the constraint set ("nobody draws themselves" plus
pairwise exclusions) is a bipartite perfect matching. Solved with a randomized
Kuhn augmenting-path algorithm, which detects unsatisfiable inputs exactly
(no retry loops, no invalid output). 100 participants with 20 exclusions
resolves in milliseconds.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the services below
npm run dev                  # http://localhost:3000
```

Required services:

- **Supabase** — run the SQL files in `supabase/migrations/` in order
- **Resend** — API key + verified sending domain
- **Waffo** — one-time product, merchant id, private key, webhook (`Payload: Raw`)

`PAYMENTS_MODE=test` uses test credentials with card `4576 7500 0000 0110`.

## Tests

```bash
npm test          # vitest
npx tsc --noEmit  # type check
npm run build     # production build
```

## Deployment

Deployed on Vercel from `main`. Environment variables live in Vercel project
settings; see `LAUNCH-CHECKLIST.md` for the full pre-launch list.

The email retry queue is triggered by an external 5-minute cron
(cron-job.org) hitting `/api/cron/email-queue` with `Authorization: Bearer
$CRON_SECRET`, because Vercel's Hobby plan only allows daily crons.

## About the Author

Independent developer, previously worked at [Huawei] and other large tech companies. 12+ years of cloud computing R&D, expert in ES cloud services, proficient in Java and Python. Independently runs SnapByFace (face recognition and photo grouping) and SantaWheel (Christmas gift exchange tool), focused on AI tool products.

- X (Twitter): https://x.com/@DengXiaoho71001
- YouTube: https://www.youtube.com/@xiaohongdeng-q1y
- Zhihu: https://www.zhihu.com/people/exeta1
- Product Hunt: https://www.producthunt.com/products/snapbyface?launch=snapbyface
- LinkedIn: https://www.linkedin.com/in/xiaohong-deng-781b1b443
- GitHub: https://github.com/xiaohongaiweno

## My Products

### SnapByFace — Offline-First Desktop Face Search Tool

SnapByFace is an offline-first desktop tool for face search and photo organization, available for macOS and Windows.

- **Local AI recognition**: face detection and feature extraction powered by ONNX Runtime — all computation happens locally, photos never leave the device
- **Search by photo**: import one reference face and find every photo of that person across tens of thousands of images
- **Video support**: works on images and extracts frames from video files for face recognition
- **Privacy first**: no cloud dependencies, no accounts, all data stored in a local SQLite database
- **Multilingual**: Chinese / English interface

Website: https://snapbyface.com/

### SantaWheel — Free Online Secret Santa Generator

SantaWheel is a free, sign-up-free online Secret Santa gift exchange tool that works in the browser on mobile and desktop, for groups of up to 100 people.

- **One-click draw**: paste your participant list and get valid pairs — no self-draws, no duplicates, with redraw protection
- **Exclusion rules**: keep couples and managers/reports apart; rules apply in both directions, and unsolvable conflicts are reported clearly
- **Multiple delivery methods**: automatic email, private links (share via WhatsApp/SMS — no email needed), or self-join links
- **Privacy**: blind mode hides pairings even from the organizer; anonymous Q&A (sizes, preferences) the organizer cannot see
- **Wishlists**: participants can add gift wishes and a shipping address, visible only to whoever drew them
- **White elephant mode**: White Elephant / Yankee Swap / Dirty Santa with an automatic opening and stealing order (including the 3-steal lock rule)
- **Scheduled draws**: set a draw time in advance, cancel it, or draw manually anytime

Website: https://santawheel.com
