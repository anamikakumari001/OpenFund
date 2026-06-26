import * as StellarSdk from "@stellar/stellar-sdk";
import { HORIZON_TESTNET_URL, STELLAR_TESTNET_PASSPHRASE } from "@/lib/stellar-wallet";

const server = new StellarSdk.Horizon.Server(HORIZON_TESTNET_URL);

export async function fetchXlmBalance(address: string): Promise<string> {
  try {
    const account = await server.loadAccount(address);
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
  const account = await server.loadAccount(from);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
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
  const tx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    STELLAR_TESTNET_PASSPHRASE
  );
  const result = await server.submitTransaction(tx);
  return { hash: result.hash };
}
