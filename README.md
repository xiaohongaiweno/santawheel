# SantaWheel

Free Secret Santa / gift exchange generator — [santawheel.com](https://santawheel.com)

Paste a participant list, get a valid draw (nobody draws themselves, exclusion
rules respected), and every participant receives a private link showing only
their own assignment.

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
