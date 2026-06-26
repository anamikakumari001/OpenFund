import * as StellarSdk from "@stellar/stellar-sdk";
import { server, networkPassphrase } from "./stellar-sdk";

export const CONTRACT_ID: string =
  process.env.NEXT_PUBLIC_CONTRACT_ID ??
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID ??
  process.env.ESCROW_CONTRACT_ID ??
  "";

/**
 * Generic Soroban contract invocation.
 * Loads the signer account, builds and simulates a transaction,
 * then assembles, signs, and submits it.
 */
export async function callContractFunction(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  signerSecret: string
): Promise<{ txHash: string; result: StellarSdk.xdr.ScVal | null }> {
  const keypair = StellarSdk.Keypair.fromSecret(signerSecret);
  const account = await server.getAccount(keypair.publicKey());

  const contract = new StellarSdk.Contract(contractId);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = StellarSdk.rpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(keypair);

  const sendResult = await server.sendTransaction(preparedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  const txHash = sendResult.hash;

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const status = await server.getTransaction(txHash);
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      return { txHash, result: status.returnValue ?? null };
    }
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Contract invocation failed: ${txHash}`);
    }
  }
  throw new Error(`Transaction confirmation timeout: ${txHash}`);
}

// ─── Per-function callers mapping every public contract function ──────────────
// These wrap callContractFunction with typed arguments matching lib.rs exactly.

export {
  initMilestone,
  fundMilestoneEscrow,
  releaseMilestoneEscrow,
  cancelMilestoneEscrow,
  refundMilestoneEscrow,
  getMilestoneEscrowInfo,
  getDonorEscrowAmount,
} from "./escrow";

/**
 * Read-only query for `get_balance` — returns the escrowed USDC amount
 * (in human-readable units) for a given milestone.
 */
export async function getMilestoneBalance(milestoneId: string): Promise<number> {
  const { getMilestoneEscrowInfo } = await import("./escrow");
  const info = await getMilestoneEscrowInfo(milestoneId);
  return info?.balance ?? 0;
}
