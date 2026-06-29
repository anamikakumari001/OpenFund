# CI/CD Workflows

This directory holds the project's GitHub Actions pipeline. Every file is a
standalone, root-level `.github/workflows/*.yml` definition so each graded
stage can be verified independently.

| Workflow file | Type | Triggers | What it validates |
|---------------|------|----------|-------------------|
| [`frontend-ci.yml`](./frontend-ci.yml) | **CI — Frontend** | push to `main`/`develop`, PRs | `npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm run test:ci` → `npm run build` |
| [`contract-ci.yml`](./contract-ci.yml) | **CI — Smart Contract** | push to `main`/`develop`, PRs | `cargo fmt --check` → `cargo clippy` → `cargo test` → `cargo build --target wasm32-unknown-unknown --release` |
| [`deploy.yml`](./deploy.yml) | **CD — Contract + Frontend** | push to `main` | `stellar contract deploy` to Stellar testnet, then Vercel **production** deploy |
| [`preview.yml`](./preview.yml) | **CD — Preview** | pull requests | Vercel **preview** deploy + PR comment with the preview URL |

Related deployment config lives at the repository root:

- [`../../vercel.json`](../../vercel.json) — Vercel framework / build / install / git-deploy configuration
- [`../../contracts/milestone-escrow/Cargo.lock`](../../contracts/milestone-escrow/Cargo.lock) — pinned Rust lockfile for reproducible contract builds

## Required GitHub Actions secrets

| Secret | Used by | Purpose |
|--------|---------|---------|
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `deploy.yml`, `preview.yml` | Vercel deployments |
| `STELLAR_SECRET_KEY` | `deploy.yml` | Signs the `stellar contract deploy` transaction |
| `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | `deploy.yml` | Production frontend build env |
| `GH_CLIENT_ID`, `GH_CLIENT_SECRET` | `deploy.yml` | GitHub OAuth for NextAuth |
| `NEXT_PUBLIC_CONTRACT_ID` | `deploy.yml` | Deployed escrow contract address |
