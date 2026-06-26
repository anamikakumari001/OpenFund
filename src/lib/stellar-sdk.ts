import * as StellarSdk from "@stellar/stellar-sdk";
import { HORIZON_TESTNET_URL, STELLAR_TESTNET_PASSPHRASE } from "@/lib/stellar-wallet";

export { StellarSdk };

// ─── Soroban RPC ─────────────────────────────────────────────────────────────

const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
  process.env.STELLAR_RPC_URL ??
  "https://soroban-testnet.stellar.org";

export const networkPassphrase: string =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? STELLAR_TESTNET_PASSPHRASE;

export const server = new StellarSdk.rpc.Server(RPC_URL, { allowHttp: false });

// ─── Horizon (wallet / payment helpers) ──────────────────────────────────────

const horizonServer = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL);

export async function fetchXlmBalance(address: string): Promise<string> {
  try {
    const account = await horizonServer.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native?.balance ?? "0";
  } catch (err) {
    if (err instanceof StellarSdk.NotFoundError) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    throw err;
  }
}

export async function buildPaymentXdr(
  from: string,
  to: string,
  amount: string
): Promise<string> {
  const account = await horizonServer.loadAccount(from);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: to,
        asset: StellarSdk.Asset.native(),
        amount,
      })
    )
    .setTimeout(30)
    .build();
  return tx.toXDR();
}

export async function submitSignedTx(signedXdr: string): Promise<{ hash: string }> {
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  const result = await horizonServer.submitTransaction(tx);
  return { hash: result.hash };
}
