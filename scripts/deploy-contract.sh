#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-contract.sh — Build & deploy the milestone-escrow Soroban contract
#
# Prerequisites:
#   - Rust + cargo (stable)
#   - wasm32-unknown-unknown target: rustup target add wasm32-unknown-unknown
#   - Stellar CLI: cargo install --locked stellar-cli
#   - Funded testnet account aliased as "openfund-deployer":
#       stellar keys generate openfund-deployer --network testnet
#       stellar keys fund openfund-deployer --network testnet
#
# Usage:
#   STELLAR_NETWORK=testnet bash scripts/deploy-contract.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

NETWORK="${STELLAR_NETWORK:-testnet}"
CONTRACT_DIR="$(dirname "$0")/../contracts/milestone-escrow"
WASM_PATH="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/milestone_escrow.wasm"
DEPLOYER_KEY="openfund-deployer"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " OpenFund — Milestone Escrow Contract Deployment"
echo " Network : $NETWORK"
echo " Deployer: $DEPLOYER_KEY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1 — Build the WASM
echo ""
echo "▶ Building contract WASM..."
cd "$CONTRACT_DIR"
cargo build --target wasm32-unknown-unknown --release
echo "  ✓ Build complete: $WASM_PATH"

# Step 2 — Optimize the WASM (optional, requires wasm-opt)
if command -v wasm-opt &> /dev/null; then
  echo "▶ Optimizing WASM with wasm-opt..."
  wasm-opt -Oz "$WASM_PATH" -o "$WASM_PATH"
  echo "  ✓ Optimization complete"
fi

# Step 3 — Deploy to Stellar
echo ""
echo "▶ Deploying to Stellar ($NETWORK)..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$DEPLOYER_KEY" \
  --network "$NETWORK" \
  --ignore-checks)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✓ Contract deployed successfully!"
echo " Contract ID: $CONTRACT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " Add to your .env:"
echo "   ESCROW_CONTRACT_ID=\"$CONTRACT_ID\""
echo "   NEXT_PUBLIC_ESCROW_CONTRACT_ID=\"$CONTRACT_ID\""
echo ""
echo " Explorer: https://stellar.expert/explorer/$NETWORK/contract/$CONTRACT_ID"
echo ""
