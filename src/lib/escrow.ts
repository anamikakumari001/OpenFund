import * as StellarSdk from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASE } from "./stellar";

const RPC_URL =
  process.env.STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";

const CONTRACT_ID =
  process.env.ESCROW_CONTRACT_ID ?? "";

const USDC_SAC =
  process.env.USDC_SAC_ADDRESS ?? "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

export const rpcServer = new StellarSdk.rpc.Server(RPC_URL, { allowHttp: false });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function symToScVal(s: string) {
  return StellarSdk.xdr.ScVal.scvSymbol(Buffer.from(s, "utf-8"));
}

function addrToScVal(address: string) {
  return new StellarSdk.Address(address).toScVal();
}

function i128ToScVal(value: bigint) {
  return StellarSdk.nativeToScVal(value, { type: "i128" });
}

// Build and submit a Soroban contract invocation transaction
async function invokeContract(
  functionName: string,
  args: StellarSdk.xdr.ScVal[],
  signerSecret: string
): Promise<{ txHash: string; result: StellarSdk.xdr.ScVal | null }> {
  const keypair = StellarSdk.Keypair.fromSecret(signerSecret);
  const account = await rpcServer.getAccount(keypair.publicKey());

  const contract = new StellarSdk.Contract(CONTRACT_ID);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(functionName, ...args))
    .setTimeout(30)
    .build();

  const simResult = await rpcServer.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = StellarSdk.rpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(keypair);

  const sendResult = await rpcServer.sendTransaction(preparedTx);
  if (sendResult.status === "ERROR") {
    throw new Error(`Transaction failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  const txHash = sendResult.hash;

  // Poll for confirmation
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const status = await rpcServer.getTransaction(txHash);
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.SUCCESS) {
      return { txHash, result: status.returnValue ?? null };
    }
    if (status.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(`Contract invocation failed: ${txHash}`);
    }
  }
  throw new Error(`Transaction confirmation timeout: ${txHash}`);
}

// ─── Contract functions ───────────────────────────────────────────────────────

/**
 * Initialize a milestone escrow slot.
 * Called by the project owner when a milestone is created.
 */
export async function initMilestone(
  milestoneId: string,
  adminSecret: string,
  adminPublicKey: string,
  treasuryAddress: string
) {
  const args = [
    symToScVal(milestoneId),
    addrToScVal(adminPublicKey),
    addrToScVal(treasuryAddress),
    addrToScVal(USDC_SAC),
  ];
  return invokeContract("init_milestone", args, adminSecret);
}

/**
 * Donor funds a milestone into escrow.
 * Must be called with the donor's secret key.
 */
export async function fundMilestoneEscrow(
  milestoneId: string,
  donorSecret: string,
  donorPublicKey: string,
  amountUsdc: number
): Promise<{ txHash: string }> {
  const stroops = BigInt(Math.round(amountUsdc * 10_000_000));
  const args = [
    symToScVal(milestoneId),
    addrToScVal(donorPublicKey),
    i128ToScVal(stroops),
  ];
  const { txHash } = await invokeContract("fund", args, donorSecret);
  return { txHash };
}

/**
 * Project owner releases escrowed funds to treasury.
 */
export async function releaseMilestoneEscrow(
  milestoneId: string,
  adminSecret: string
): Promise<{ txHash: string }> {
  const args = [symToScVal(milestoneId)];
  const { txHash } = await invokeContract("release", args, adminSecret);
  return { txHash };
}

/**
 * Project owner cancels escrow (enables refunds).
 */
export async function cancelMilestoneEscrow(
  milestoneId: string,
  adminSecret: string
): Promise<{ txHash: string }> {
  const args = [symToScVal(milestoneId)];
  const { txHash } = await invokeContract("cancel", args, adminSecret);
  return { txHash };
}

/**
 * Donor claims a refund after cancellation.
 */
export async function refundMilestoneEscrow(
  milestoneId: string,
  donorSecret: string,
  donorPublicKey: string
): Promise<{ txHash: string }> {
  const args = [symToScVal(milestoneId), addrToScVal(donorPublicKey)];
  const { txHash } = await invokeContract("refund", args, donorSecret);
  return { txHash };
}

// ─── Read-only queries ────────────────────────────────────────────────────────

export interface EscrowInfo {
  balance: number;
  released: boolean;
  cancelled: boolean;
  treasury: string;
}

// Use the deployer account (exists on-chain) for read-only simulations
async function simulateRead(
  functionName: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal | null> {
  const deployerSecret = process.env.ESCROW_DEPLOYER_SECRET;
  if (!deployerSecret) return null;

  const deployer = StellarSdk.Keypair.fromSecret(deployerSecret);
  const contract = new StellarSdk.Contract(CONTRACT_ID);

  try {
    const account = await rpcServer.getAccount(deployer.publicKey());
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(functionName, ...args))
      .setTimeout(30)
      .build();

    const simResult = await rpcServer.simulateTransaction(tx);
    if (StellarSdk.rpc.Api.isSimulationSuccess(simResult) && simResult.result) {
      return simResult.result.retval;
    }
  } catch {
    // ignore — milestone may not exist on-chain yet
  }
  return null;
}

export async function getMilestoneEscrowInfo(
  milestoneId: string
): Promise<EscrowInfo | null> {
  try {
    const val = await simulateRead("get_info", [symToScVal(milestoneId)]);
    if (!val) return null;

    // get_info returns Option<MilestoneInfo>:
    //   None  → scvVoid (falsy value)
    //   Some  → the struct as scvMap directly
    const native = StellarSdk.scValToNative(val) as Record<string, unknown> | null | undefined;
    if (!native || typeof native !== "object") return null;

    const balance = Number(native.balance as bigint) / 10_000_000;
    const released = Boolean(native.released);
    const cancelled = Boolean(native.cancelled);
    // Address is returned as an Address object by scValToNative
    const treasury = String(native.treasury ?? "");

    return { balance, released, cancelled, treasury };
  } catch {
    return null;
  }
}

export async function getDonorEscrowAmount(
  milestoneId: string,
  donorAddress: string
): Promise<number> {
  try {
    const val = await simulateRead("get_donor_amount", [
      symToScVal(milestoneId),
      addrToScVal(donorAddress),
    ]);
    if (!val) return 0;
    const native = StellarSdk.scValToNative(val);
    if (native === null || native === undefined) return 0;
    return Number(native as bigint) / 10_000_000;
  } catch {
    return 0;
  }
}
