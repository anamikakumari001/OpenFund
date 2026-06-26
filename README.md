# OpenFund

> GitHub-connected crowdfunding on the Stellar blockchain — fund open-source projects with milestone-based escrow

[![Live Demo](https://img.shields.io/badge/Live-openfund--alpha.vercel.app-22c55e?logo=vercel)](https://openfund-alpha.vercel.app)
[![CI/CD](https://github.com/anamikakumari001/OpenFund/actions/workflows/ci.yml/badge.svg)](https://github.com/anamikakumari001/OpenFund/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-6C3FF4)](https://stellar.expert/explorer/testnet/contract/CCRZRCMEVQUV6WM2IJVWTIDDLHFJAWRVWR4JR3YBWY6JA5E3RREP7QQS)

---
| **🚀 Live Demo** | **🎥 Demo Video** |
|:----------------:|:-----------------:|
| [🌐 OpenFund](https://openfund-alpha.vercel.app/) | [▶️ Watch Demo](https://youtu.be/g9u9IFwh07Q) |
---

## Overview

OpenFund is a decentralized crowdfunding platform that connects open-source maintainers with supporters. Projects are imported directly from GitHub, funding happens on-chain via **Stellar USDC**, and milestone commitments are enforced by a **Soroban smart contract escrow** — donors can be confident their funds are only released when real progress is delivered.

### Key Value Propositions

| For Maintainers | For Donors |
|----------------|------------|
| Import any GitHub repo in seconds | Fund with USDC on Stellar (instant, ~$0.0001 fees) |
| Create milestones tied to GitHub issues | Milestone escrow: money back if cancelled |
| Real-time treasury visibility | Transparent on-chain donation history |
| GitHub activity drives trust scores | Discover projects by health score |

---

## Features

- **GitHub OAuth** — Sign in with GitHub; all project data synced from the GitHub API
- **Project Discovery** — Explore page with category filters, trending, health-score sort
- **Health Score** — Algorithmic score based on stars, activity, open issues, contributors
- **Stellar Wallet** — Freighter browser extension + auto-generated custodial wallets
- **USDC Donations** — Direct payments and milestone escrow on Stellar testnet
- **Milestone Escrow** — Soroban contract locks funds; released by owner or refunded to donors
- **Real-Time Updates** — Server-Sent Events stream live donation/milestone events to the UI
- **Notifications** — In-app notification bell for donation, release, and milestone events
- **Roadmap View** — Visual milestone progress with escrow status badges
- **Treasury Panel** — Live Stellar balance and recent transaction feed
- **Analytics** — Project-level page views, donation counts, supporter leaderboard
- **Mobile Responsive** — Tailored layouts for mobile, tablet, and desktop

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 16)                 │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  App Dir  │  │  React Query │  │  Zustand Stores   │  │
│  │  (RSC +  │  │  (Server +   │  │  stellar.ts       │  │
│  │  Client) │  │  Client)     │  │  ui.ts            │  │
│  └───────────┘  └──────────────┘  └───────────────────┘  │
└──────────────────────────────┬───────────────────────────┘
                               │ HTTP / SSE
┌──────────────────────────────▼───────────────────────────┐
│                    API Layer (Next.js Routes)              │
│  /api/projects  /api/escrow/*  /api/stellar/*             │
│  /api/auth      /api/milestones  /api/[slug]/stream       │
└────────┬───────────────────────────────┬─────────────────┘
         │ Prisma ORM                    │ Stellar SDK
┌────────▼──────────┐          ┌─────────▼────────────────┐
│   PostgreSQL DB   │          │   Stellar Blockchain       │
│   (Prisma schema) │          │  ┌──────────────────────┐ │
│                   │          │  │  Horizon (payments)  │ │
│  Users, Projects  │          │  │  Soroban RPC (escrow)│ │
│  Milestones       │          │  │  Freighter (browser) │ │
│  Donations        │          │  └──────────────────────┘ │
└───────────────────┘          └──────────────────────────┘
```

### Data Flow: Milestone Escrow

```
Donor                  Frontend              API              Soroban Contract
  │                       │                   │                     │
  ├─"Fund Milestone"──────►│                   │                     │
  │                       ├─POST /escrow/fund─►│                     │
  │                       │                   ├─init_milestone()────►│
  │                       │                   │      (if first funder)│
  │                       │                   ├─fund()──────────────►│
  │                       │                   │◄─{txHash}────────────┤
  │                       │                   ├─DB: record donation   │
  │◄─txHash + Explorer────┤◄─{txHash, donId}──┤                     │
  │                       │                   │                     │
  │ ... later ...         │                   │                     │
Owner                      │                   │                     │
  ├─"Release Escrow"──────►│                   │                     │
  │                       ├─POST /escrow/release►│                  │
  │                       │                   ├─release()──────────►│
  │                       │                   │◄─{txHash}────────────┤
  │◄─Released!────────────┤                   ├─DB: mark released    │
```

---

# Screenshots

## 📱 Mobile Responsive

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/cf0b7492-a517-4b53-a356-0c117c51d68f"
    width="300"
    alt="Mobile Responsive"
  />
</p>

## ⚙️ GitHub Actions CI/CD Pipeline

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/404cca69-0f5b-4b31-af03-7c83f9005fcf"
    width="1000"
    alt="GitHub Actions CI/CD Pipeline"
  />
</p>

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js | 16.2.9 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| State (server) | TanStack React Query | 5.x |
| State (client) | Zustand | 5.x |
| Authentication | NextAuth.js | 5 (beta) |
| Database ORM | Prisma | 7.x |
| Database | PostgreSQL | 15+ |
| Blockchain | Stellar | Testnet |
| Smart Contract | Soroban (Rust) | SDK v22 |
| Wallet | Freighter | 6.x |
| 3D Visualizations | Three.js / R3F | 0.184 |
| Charts | Recharts | 3.x |
| Animations | Framer Motion + GSAP | 12.x / 3.x |
| Real-Time | Server-Sent Events | native |
| Testing | Jest + Testing Library | 29.x / 16.x |

---

## Smart Contract

### Deployed Contract (Testnet)

| Parameter | Value |
|-----------|-------|
| **Contract ID** | `CCRZRCMEVQUV6WM2IJVWTIDDLHFJAWRVWR4JR3YBWY6JA5E3RREP7QQS` |
| **Network** | Stellar Testnet |
| **USDC SAC** | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |
| **Explorer** | [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCRZRCMEVQUV6WM2IJVWTIDDLHFJAWRVWR4JR3YBWY6JA5E3RREP7QQS) |

### Contract Functions

| Function | Caller | Description |
|----------|--------|-------------|
| `init_milestone(id, admin, treasury, token)` | Project owner | Creates escrow slot for a milestone |
| `fund(id, donor, amount)` | Donor | Locks USDC into escrow; emits `fund` event |
| `release(id)` | Project owner | Sends all escrowed funds to treasury; emits `release` event |
| `cancel(id)` | Project owner | Marks escrow cancelled; emits `cancel` event |
| `refund(id, donor)` | Donor | Returns donor's share after cancellation; emits `refund` event |
| `get_info(id)` | Anyone (read) | Returns `Option<MilestoneInfo>` |
| `get_balance(id)` | Anyone (read) | Returns current escrowed balance |
| `get_donor_amount(id, donor)` | Anyone (read) | Returns a specific donor's escrowed amount |

### Contract Events

Each mutating function emits a Soroban contract event:

| Event | Topics | Data |
|-------|--------|------|
| `init` | `(Symbol("init"), milestone_id)` | `(admin, treasury)` |
| `fund` | `(Symbol("fund"), milestone_id)` | `(donor, amount, new_balance)` |
| `release` | `(Symbol("release"), milestone_id)` | `(treasury, amount)` |
| `cancel` | `(Symbol("cancel"), milestone_id)` | `(admin,)` |
| `refund` | `(Symbol("refund"), milestone_id)` | `(donor, amount)` |

---

## Installation

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **PostgreSQL** 15+
- **Rust** stable (for contract development)
- **Freighter** browser extension (for Stellar wallet)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/openfund.git
cd openfund/openfund

# 2. Install Node dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Edit .env with your values

# 4. Set up the database
npx prisma migrate dev --name init

# 5. (Optional) Seed sample data
node scripts/seed.mjs

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for JWT signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | Public URL of the app |
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App client secret |
| `STELLAR_NETWORK` | ✅ | `testnet` or `mainnet` |
| `STELLAR_HORIZON_URL` | ✅ | Horizon server URL |
| `STELLAR_RPC_URL` | ✅ | Soroban RPC URL |
| `ESCROW_CONTRACT_ID` | ✅ | Deployed escrow contract address |
| `ESCROW_DEPLOYER_SECRET` | ✅ | Deployer Stellar secret key (for read-only RPC calls) |
| `USDC_SAC_ADDRESS` | ✅ | USDC Stellar Asset Contract address |
| `NEXT_PUBLIC_STELLAR_NETWORK` | ✅ | Browser-visible network name |
| `NEXT_PUBLIC_ESCROW_CONTRACT_ID` | ✅ | Browser-visible contract ID |
| `NEXT_PUBLIC_APP_URL` | ✅ | Browser-visible app URL |

See `.env.example` for the complete template.

---

## Smart Contract Deployment

### Requirements

```bash
# Install Rust wasm target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli

# Generate and fund a testnet deployer account
stellar keys generate openfund-deployer --network testnet
stellar keys fund openfund-deployer --network testnet
```

### Deploy

```bash
# From the repo root
STELLAR_NETWORK=testnet bash scripts/deploy-contract.sh
```

The script will:
1. Build the optimized WASM binary
2. Deploy to Stellar testnet via `stellar contract deploy`
3. Print the new Contract ID

### Verify

```bash
# Call get_balance on-chain (replace MS_ID with a Symbol)
stellar contract invoke \
  --id CCRZRCMEVQUV6WM2IJVWTIDDLHFJAWRVWR4JR3YBWY6JA5E3RREP7QQS \
  --source openfund-deployer \
  --network testnet \
  -- get_balance --milestone_id ms1
```

---

## Event Streaming Architecture

OpenFund uses **Server-Sent Events (SSE)** for real-time updates.

### Endpoint

```
GET /api/projects/{slug}/stream
Content-Type: text/event-stream
```

### Event Types

| Event | When | Data |
|-------|------|------|
| `CONNECTED` | On SSE connection established | `{ slug, ts }` |
| `HEARTBEAT` | Every 25 seconds | `{ ts }` |
| `DONATION` | When a donation is recorded | `{ projectId, amount, txHash }` |
| `MILESTONE` | When milestone status changes | `{ milestoneId, status }` |
| `ESCROW` | When escrow state changes | `{ milestoneId, event }` |

### Client Usage

```typescript
import { useRealtimeProject } from "@/hooks/use-realtime";

function ProjectPage({ slug }: { slug: string }) {
  useRealtimeProject(slug); // invalidates query cache on events
  // ...
}
```

### Reconnection Strategy

The `useRealtimeProject` hook implements exponential back-off reconnection:
- Max reconnect attempts: 5
- Base delay: 3 seconds
- Delay multiplier: 2× per attempt (3s → 6s → 12s → 24s → 48s)

---

## Frontend Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── auth/           # NextAuth.js handlers
│   │   ├── escrow/         # Soroban escrow actions
│   │   ├── projects/       # CRUD + SSE stream
│   │   ├── stellar/        # Horizon payment helpers
│   │   └── milestones/     # Milestone management
│   ├── dashboard/          # Maintainer dashboard
│   ├── explore/            # Project discovery
│   ├── project/[slug]/     # Project detail page
│   ├── profile/[username]/ # User profile
│   ├── notifications/      # Notification center
│   └── settings/           # User settings
├── components/
│   ├── escrow/             # EscrowBadge, MilestoneEscrowPanel
│   ├── donation/           # DonationModal (3-step flow)
│   ├── project/            # FundingPanel, TreasuryPanel, RoadmapView
│   ├── landing/            # Hero, TrendingProjects, Features
│   ├── stellar/            # WalletButton (Freighter)
│   ├── ui/                 # Radix UI primitives (Badge, Button, etc.)
│   └── layout/             # Navbar, Footer
├── hooks/
│   ├── use-realtime.ts     # SSE subscription with reconnect
│   └── use-projects.ts     # React Query data hooks
├── lib/
│   ├── stellar.ts          # Horizon server, balance, transactions
│   ├── escrow.ts           # Soroban RPC contract calls
│   ├── auth.ts             # NextAuth config
│   ├── github.ts           # GitHub API wrapper
│   └── utils.ts            # formatNumber, timeAgo, slugify, etc.
├── stores/
│   ├── stellar.ts          # Freighter wallet Zustand store
│   └── ui.ts               # Global UI state
└── types/
    ├── index.ts            # Shared TypeScript interfaces
    └── next-auth.d.ts      # NextAuth session type augmentation
```

### Key Design Decisions

- **React Server Components** for initial data fetching (no client JS until needed)
- **React Query** for cache management and background refetching
- **Zustand** for ephemeral client state (wallet, modals)
- **Dynamic imports** for heavy 3D components (Three.js ecosystem)
- **SSE over WebSocket** — simpler server-side implementation, works through HTTP/2

---

## Testing

### Run All Tests

```bash
# Unit + component tests
npm test

# With coverage report
npm run test:coverage

# CI mode (no interactive prompts)
npm run test:ci
```

### Contract Tests

```bash
cd contracts/milestone-escrow
cargo test --features testutils
```

### Test Output (sample)

```
PASS src/__tests__/lib/utils.test.ts
  formatNumber
    ✓ formats millions with 1 decimal (2 ms)
    ✓ formats thousands with 1 decimal (1 ms)
    ✓ returns raw string for numbers below 1000 (1 ms)
  formatCurrency
    ✓ formats USDC amounts with 2 decimal places (1 ms)
    ✓ uses USDC as default currency (1 ms)
  getHealthColor
    ✓ returns green for high health scores (1 ms)
    ✓ returns blue for good scores (1 ms)
  getSupporterLevel
    ✓ returns Legend at 1000+ USDC with no next level (1 ms)

PASS src/__tests__/components/badge.test.tsx
PASS src/__tests__/components/escrow-badge.test.tsx
PASS src/__tests__/api/escrow-validation.test.ts

Test Suites: 4 passed, 4 total
Tests:       28+ passed, 0 failed
Coverage:    >70% statements
```

### Contract Test Output (sample)

```
running 10 tests
test tests::test_init_milestone_creates_correct_state ... ok
test tests::test_fund_increases_balance_and_tracks_donor ... ok
test tests::test_multiple_donors_accumulate_balance ... ok
test tests::test_release_sends_funds_to_treasury ... ok
test tests::test_cancel_then_refund ... ok
test tests::test_double_init_panics ... ok
test tests::test_release_with_zero_balance_panics ... ok
test tests::test_refund_before_cancel_panics ... ok
test tests::test_fund_after_release_panics ... ok
test tests::test_get_info_returns_none_for_unknown_milestone ... ok

test result: ok. 10 passed; 0 failed; 0 ignored
```

---

## CI/CD Pipeline

The pipeline runs on every push to `main`/`develop` and on all pull requests.

### Pipeline Stages

```
Push → lint-and-typecheck → frontend-tests → build → [deploy on main]
Push → contract-tests (parallel)
```

| Stage | What it does |
|-------|-------------|
| **lint-and-typecheck** | ESLint + `tsc --noEmit` |
| **frontend-tests** | Jest unit/component tests with coverage |
| **build** | `next build` — verifies the production bundle compiles |
| **contract-tests** | `cargo fmt --check`, `cargo clippy`, `cargo test`, WASM build |
| **deploy** | Triggered on `main` pushes — deploys to Vercel/Railway |

### Artifacts

- `coverage-report/` — Jest coverage HTML + JSON
- `nextjs-build/` — Production `.next/` bundle
- `milestone-escrow-wasm/` — Optimized `.wasm` binary
- `contract-test-output.txt` — Raw contract test log

---

## Deployment Guide

### Live Deployment

| Resource | URL |
|----------|-----|
| **Live App** | https://openfund-alpha.vercel.app |
| **GitHub Repo** | https://github.com/anamikakumari001/OpenFund |
| **Escrow Contract** | [`CCRZRCMEVQUV6WM2IJVWTIDDLHFJAWRVWR4JR3YBWY6JA5E3RREP7QQS`](https://stellar.expert/explorer/testnet/contract/CCRZRCMEVQUV6WM2IJVWTIDDLHFJAWRVWR4JR3YBWY6JA5E3RREP7QQS) |
| **Network** | Stellar Testnet |
| **USDC SAC** | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

### CI/CD Auto-Deploy

Every push to `main` triggers the 6-stage GitHub Actions pipeline:
1. Lint & TypeScript check
2. Frontend tests (72 Jest tests)
3. Next.js production build
4. Soroban contract tests (10 Rust unit tests)
5. **Automatic Vercel production deploy** (requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets in GitHub)
6. Preview deploy for PRs with URL comment

### Manual Frontend Deploy (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Link and deploy from openfund/ directory
cd openfund
vercel link --scope anamika-raj
vercel deploy --prod --scope anamika-raj
```

Set all environment variables from `.env.example` in the Vercel dashboard under **Project Settings → Environment Variables**.

### GitHub Actions Secrets Required

Add these to **GitHub → Settings → Secrets and variables → Actions**:

| Secret | How to get it |
|--------|---------------|
| `VERCEL_TOKEN` | Vercel dashboard → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` after `vercel link` |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | GitHub OAuth App → Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App → Client Secret |

### Database

```bash
# Run migrations against production DB
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Rollback Strategy

```bash
# Vercel: instant rollback to previous deployment
vercel rollback

# Manual: revert the git commit and redeploy
git revert HEAD
git push origin main
```

### Environment Checklist

- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] `NEXTAUTH_SECRET` is a unique random string (not reused from dev)
- [ ] `NEXTAUTH_URL` set to `https://openfund-alpha.vercel.app` (or your domain)
- [ ] `GITHUB_CLIENT_ID/SECRET` from a production OAuth App with correct callback URL
- [ ] `ESCROW_CONTRACT_ID` = `CCRZRCMEVQUV6WM2IJVWTIDDLHFJAWRVWR4JR3YBWY6JA5E3RREP7QQS`
- [ ] `ESCROW_DEPLOYER_SECRET` is secured (not in logs/CI env output)

---

## Troubleshooting

### "Simulation failed" on escrow fund

- The milestone must be initialized first (`init_milestone`). This happens automatically on the first fund but requires the project owner's Stellar secret key.
- Verify `ESCROW_DEPLOYER_SECRET` is set correctly.
- Ensure the donor's Stellar account has sufficient USDC and XLM for fees.

### "No Stellar wallet" error

- The user's `stellarPublicKey` / `stellarSecretKey` are set during initial GitHub OAuth sign-in. If missing, sign out and sign back in.

### Freighter not detected

- Ensure the Freighter browser extension is installed and the user is signed in to it.
- The wallet button falls back gracefully with an "Install Freighter" message.

### Database connection errors

- Check `DATABASE_URL` format: `postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public`
- Ensure PostgreSQL is running and the user has the correct permissions.
- Run `npx prisma migrate deploy` to ensure schema is up to date.

### SSE stream not connecting

- SSE requires HTTP/2 or persistent HTTP/1.1 connections; some proxies buffer SSE.
- The `X-Accel-Buffering: no` header disables nginx buffering automatically.
- The UI falls back to 30-second polling if SSE fails.

---

## Demo Walkthrough

### 1. Sign In with GitHub

Navigate to `http://localhost:3000` → click **Sign in with GitHub** → authorize the OAuth app. A Stellar testnet wallet is auto-generated for your account.

### 2. Import a Project

Click your avatar → **Dashboard** → **Import Project** → enter a GitHub owner/repo (e.g., `vercel/next.js`). OpenFund fetches metadata, contributors, and computes a health score.

### 3. Fund a Milestone

Open any project → **Milestones** tab → click the escrow badge on a milestone → enter an amount → **Escrow Funds**. The Soroban contract locks your USDC on-chain and returns a transaction hash.

### 4. Release or Refund

- **Project owner**: Click **Release to Treasury** to send funds on milestone completion.
- **Donor**: If the owner cancels, click **Claim Refund** to recover your USDC.

All transactions are visible on [Stellar Expert](https://stellar.expert/explorer/testnet).

---

## Security

### Smart Contract

- **Re-entrancy guard**: Donor balance zeroed before token transfer in `refund()`
- **Access control**: `require_auth()` on all state-changing functions
- **Invariant checks**: `assert!` on released/cancelled state before each action
- **Double-init protection**: `storage.has()` check prevents milestone overwrite
- **No admin key**: No contract superuser; only the milestone's `admin` field controls release/cancel

### Frontend / API

- All escrow API routes verify session authentication (`auth()`)
- Ownership checks on release, cancel (must be `ownerId`)
- No secret keys exposed to browser — all Soroban calls happen server-side
- `ESCROW_DEPLOYER_SECRET` never included in `NEXT_PUBLIC_*` variables

### Known Limitations

- Stellar secret keys stored in PostgreSQL are encrypted at rest only if your cloud provider encrypts the disk. Consider key custody solutions (Hardware Security Module) for production.
- The deployer secret key is used for read-only Soroban simulations; rotating it requires updating `ESCROW_DEPLOYER_SECRET` only.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Run tests: `npm test && cd contracts/milestone-escrow && cargo test --features testutils`
4. Commit with a meaningful message
5. Open a pull request — the CI pipeline runs automatically

---

## License

MIT © 2026 OpenFund contributors
