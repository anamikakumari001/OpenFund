import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";

export const STELLAR_TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";

export async function detectFreighter(): Promise<boolean> {
  const result = await isConnected();
  return result.isConnected;
}

export async function connectWallet(): Promise<string> {
  const allowed = await isAllowed();
  if (!allowed.isAllowed) {
    const access = await requestAccess();
    if (access.error) throw new Error(String(access.error));
    if (!access.address) throw new Error("No address returned from Freighter");
    return access.address;
  }
  const result = await getAddress();
  if (result.error) throw new Error(String(result.error));
  if (!result.address) throw new Error("No address returned from Freighter");
  return result.address;
}

export async function getWalletAddress(): Promise<string | null> {
  const allowed = await isAllowed();
  if (!allowed.isAllowed) return null;
  const result = await getAddress();
  if (result.error || !result.address) return null;
  return result.address;
}

export async function signTx(xdr: string): Promise<string> {
  const result = await signTransaction(xdr, {
    networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
  });
  if (result.error) throw new Error(String(result.error));
  if (!result.signedTxXdr) throw new Error("No signed XDR returned from Freighter");
  return result.signedTxXdr;
}
