import * as StellarSdk from "@stellar/stellar-sdk";

const HORIZON_URL =
  process.env.STELLAR_NETWORK === "mainnet"
    ? "https://horizon.stellar.org"
    : "https://horizon-testnet.stellar.org";

const NETWORK_PASSPHRASE =
  process.env.STELLAR_NETWORK === "mainnet"
    ? StellarSdk.Networks.PUBLIC
    : StellarSdk.Networks.TESTNET;

export const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export const USDC_ASSET =
  process.env.STELLAR_NETWORK === "mainnet"
    ? new StellarSdk.Asset(
        "USDC",
        "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
      )
    : new StellarSdk.Asset(
        "USDC",
        "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
      );

export interface TreasuryBalance {
  xlm: string;
  usdc: string;
}

export interface TreasuryTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  memo?: string;
  createdAt: string;
}

export async function getTreasuryBalance(address: string): Promise<TreasuryBalance> {
  try {
    const account = await server.loadAccount(address);
    let xlm = "0";
    let usdc = "0";
    for (const balance of account.balances) {
      if (balance.asset_type === "native") {
        xlm = balance.balance;
      } else if (
        balance.asset_type === "credit_alphanum4" &&
        balance.asset_code === "USDC"
      ) {
        usdc = balance.balance;
      }
    }
    return { xlm, usdc };
  } catch {
    return { xlm: "0", usdc: "0" };
  }
}

export async function getRecentTransactions(
  address: string,
  limit = 10
): Promise<TreasuryTransaction[]> {
  try {
    const payments = await server
      .payments()
      .forAccount(address)
      .limit(limit)
      .order("desc")
      .call();

    const txs: TreasuryTransaction[] = [];
    for (const op of payments.records) {
      const payment = op as StellarSdk.Horizon.ServerApi.PaymentOperationRecord;
      if (payment.type === "payment") {
        txs.push({
          id: payment.id,
          hash: payment.transaction_hash,
          from: payment.from,
          to: payment.to,
          amount: payment.amount,
          asset:
            payment.asset_type === "native"
              ? "XLM"
              : payment.asset_code ?? "Unknown",
          createdAt: payment.created_at,
        });
      }
    }
    return txs;
  } catch {
    return [];
  }
}

export function createDonationMemo(projectId: string, userId: string): StellarSdk.Memo {
  const memo = `OF:${projectId.slice(0, 10)}:${userId.slice(0, 10)}`;
  return StellarSdk.Memo.text(memo);
}

export function formatStellarAmount(amount: string): string {
  return parseFloat(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  });
}

export { NETWORK_PASSPHRASE };
