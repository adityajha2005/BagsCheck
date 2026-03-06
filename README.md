# BagsCheck

**Check token health on Bags.fm. Launch tokens. Claim fees.**

BagsCheck is a hackathon project that helps creators and traders on [Bags.fm](https://bags.fm) understand token fee health at a glance, launch new tokens with optional AI-generated metadata and logos, and claim fee earnings from a single dashboard.

---

## Problem

On Bags.fm, fee distribution and claim activity are buried in raw API data. It’s hard to tell if a token is **healthy** (fees spread across many claimers), **centralized** (one or a few wallets dominate), or **dormant** (little or no fee activity). Creators also need a simple way to launch tokens and manage fee claims without jumping between tools.

## Solution

BagsCheck gives you:

1. **Token health check** — Paste any Bags token mint and get an instant verdict (HEALTHY / CENTRALIZED / DORMANT), fee overview, distribution breakdown, top claimers, and recent claim activity.
2. **Token launch** — Connect your Solana wallet, fill in token details (or generate name, symbol, description, and logo with AI), and launch on Bags in one flow.
3. **My Tokens** — View claimable fee positions and claim rewards in one place.

---

## Features

- **Verdict & patterns** — HEALTHY, CENTRALIZED, or DORMANT, plus patterns like “Single-extractor”, “Creator-heavy”, “Broad distribution”, “Abandoned fees”.
- **Fee overview** — Lifetime fees (SOL), % claimed vs unclaimed.
- **Distribution** — Creator vs non-creator share; top 1 and top 5 claimer share.
- **Claimers** — List of fee claimers with royalty %, wallet, and claimed amounts.
- **Activity** — 24h claim count, last claim time, status (Active / Quiet / Dead).
- **Launch flow** — Form + optional AI (OpenAI) for metadata and logo; create token info, fee config, and launch transaction via Bags.
- **My Tokens** — Claimable positions and one-click claim transactions (Bags SDK + Solana wallet).

---

## Tech Stack

| Layer        | Tech |
|-------------|------|
| Framework   | Next.js 16 (App Router), React 19 |
| Styling     | Tailwind CSS 4 |
| Chain       | Solana (`@solana/web3.js`, wallet adapters) |
| Bags        | [Bags.fm](https://bags.fm) — Public API v2 + `@bagsfm/bags-sdk` |
| Metadata    | Metaplex (`@metaplex-foundation/umi`, MPL Token Metadata) |
| AI (launch) | OpenAI (metadata + logo generation) |
| Analytics   | Vercel Analytics |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm / bun

### Install & run

```bash
cd bagscheck
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` in the project root:

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `BAGS_API_KEY`  | Yes (for check) | Bags.fm API key for token data (fee stats, claimers, events). |
| `OPENAI_API_KEY`| No (for launch) | Only needed for AI-generated token name, symbol, description, and logo on the Launch page. |

Without `BAGS_API_KEY`, the token check will fail. Without `OPENAI_API_KEY`, the launch page works but the “Generate with AI” option will not.

### Build for production

```bash
npm run build
npm start
```

---

## Project structure (high level)

```
app/
  page.tsx              # Home — token health check
  launch/page.tsx        # Launch — create token on Bags (form + AI)
  my-tokens/page.tsx     # My Tokens — claimable positions & claim
  api/
    check/route.ts       # POST — fetch Bags data + run analysis
    launch/...          # Token creation (metadata, logo, fee config, tx)
    claim/...           # Claim positions & build claim transactions
lib/
  bags.ts               # Bags API client (fee stats, claimers, events)
  analyze.ts            # Verdict + pattern logic, normalize for UI
  validation.ts         # Token mint validation
```

---

## API usage

- **Token check:** `POST /api/check` with `{ "tokenMint": "<mint>" }`. Returns `{ analysis }` with verdict, summary, fees, distribution, claimers, activity.
- **Launch:** Uses Bags API + SDK for token info, fee config, and transaction creation; optional OpenAI routes for metadata and logo.

---

## Hackathon notes

- Built for a hackathon; uses Bags.fm public API and official SDK.
- Rate limiting on `/api/check` (e.g. 10 req/min per IP) to avoid overloading the API.
- Solana wallet required for Launch and My Tokens; no wallet needed for the health check on the home page.

---

## License

MIT (or your chosen license).

---

**BagsCheck** — *Know your token. Launch it. Claim it.*
