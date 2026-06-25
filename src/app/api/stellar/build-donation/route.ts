import { NextRequest, NextResponse } from "next/server";
import * as StellarSdk from "@stellar/stellar-sdk";
import { server, USDC_ASSET, NETWORK_PASSPHRASE } from "@/lib/stellar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      amount,
      currency,
      senderPublicKey,
      destinationAddress,
      milestoneId,
      issueId,
    } = body as {
      projectId: string;
      amount: string;
      currency: string;
      senderPublicKey: string;
      destinationAddress: string;
      milestoneId?: string;
      issueId?: string;
    };

    if (!projectId || !amount || !currency || !senderPublicKey || !destinationAddress) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const senderAccount = await server.loadAccount(senderPublicKey);

    const asset = currency === "USDC" ? USDC_ASSET : StellarSdk.Asset.native();

    // XLM uses stroops (multiply by 1e7), USDC uses 7-decimal string format
    const paymentAmount =
      currency === "XLM"
        ? (parseFloat(amount) * 1e7).toFixed(0)
        : parseFloat(amount).toFixed(7);

    const memo = StellarSdk.Memo.text(`OF:${projectId.slice(0, 10)}`);

    const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationAddress,
          asset,
          amount: currency === "XLM" ? paymentAmount : parseFloat(amount).toFixed(7),
        })
      )
      .addMemo(memo)
      .setTimeout(300)
      .build();

    // Suppress unused variable warnings for optional fields
    void milestoneId;
    void issueId;

    return NextResponse.json({ xdr: transaction.toXDR() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
