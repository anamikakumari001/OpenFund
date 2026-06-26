# Milestone Escrow — Soroban Smart Contract

A Soroban smart contract on Stellar that holds donor funds in escrow for a
project milestone. The project owner can release funds to a treasury address
when the milestone is complete, or cancel the escrow to allow donors to claim
refunds.

## What the contract does

Each milestone gets its own escrow slot identified by a `Symbol` key.

| Function | Who calls it | What it does |
|---|---|---|
| `init_milestone` | Project owner | Creates an escrow slot with admin, treasury, and token addresses |
| `fund` | Donor | Transfers USDC from donor to the contract |
| `release` | Admin | Sends all escrowed funds to the treasury |
| `cancel` | Admin | Marks milestone cancelled; enables refunds |
| `refund` | Donor | Returns the caller's escrowed amount after cancellation |
| `get_info` | Anyone | Returns the full `MilestoneInfo` struct (read-only) |
| `get_balance` | Anyone | Returns the current escrow balance |
| `get_donor_amount` | Anyone | Returns how much a specific donor has escrowed |

## Folder structure

```
contracts/milestone-escrow/
├── Cargo.toml          # Package manifest
├── Cargo.lock          # Pinned dependency tree
├── Makefile            # Build, test, deploy shortcuts
└── src/
    └── lib.rs          # Contract code + inline unit tests
```

## How to build

Requires Rust stable with the `wasm32-unknown-unknown` target:

```bash
rustup target add wasm32-unknown-unknown
make build
# or directly:
cargo build --target wasm32-unknown-unknown --release
```

The compiled WASM will be at:
`target/wasm32-unknown-unknown/release/milestone_escrow.wasm`

## How to test

```bash
make test
# or directly:
cargo test
```

All tests run in a local Soroban test environment using `soroban_sdk::testutils`
with mocked auth — no network connection required.

## How to deploy

Requires the [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli):

```bash
cargo install --locked stellar-cli --features opt
make deploy STELLAR_SECRET_KEY=<your-secret>
# or directly:
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/milestone_escrow.wasm \
  --source <STELLAR_SECRET_KEY> \
  --network testnet
```

## Required environment variables

| Variable | Description |
|---|---|
| `STELLAR_SECRET_KEY` | Secret key of the deployer account |
| `ESCROW_CONTRACT_ID` | Contract address after deployment (set in app `.env`) |
| `USDC_SAC_ADDRESS` | USDC Stellar Asset Contract address on the target network |
| `STELLAR_RPC_URL` | Soroban RPC endpoint (default: `https://soroban-testnet.stellar.org`) |

Testnet RPC: `https://soroban-testnet.stellar.org`
Testnet Network Passphrase: `Test SDF Network ; September 2015`
