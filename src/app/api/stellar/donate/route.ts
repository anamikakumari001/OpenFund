import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as StellarSdk from "@stellar/stellar-sdk";
import { server, USDC_ASSET, NETWORK_PASSPHRASE } from "@/lib/stellar";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    projectId: string;
    amount: string;
    currency: "XLM" | "USDC";
    message?: string;
    anonymous?: boolean;
    milestoneId?: string;
    issueId?: string;
  };

  const { projectId, amount, currency, message, anonymous, milestoneId, issueId } = body;

  if (!projectId || !amount || !currency) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const amountFloat = parseFloat(amount);
  if (isNaN(amountFloat) || amountFloat <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Load user's custodial wallet
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stellarPublicKey: true, stellarSecretKey: true, name: true },
  });

  if (!user?.stellarPublicKey || !user?.stellarSecretKey) {
    return NextResponse.json(
      { error: "No Stellar wallet found. Please sign out and sign back in to auto-create one." },
      { status: 400 }
    );
  }

  // Load project treasury
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { treasuryAddress: true, name: true, ownerId: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.treasuryAddress) {
    return NextResponse.json({ error: "Project has no treasury address" }, { status: 400 });
  }

  // Can't donate to yourself
  if (project.ownerId === session.user.id) {
    return NextResponse.json({ error: "You cannot donate to your own project" }, { status: 400 });
  }

  try {
    const keypair = StellarSdk.Keypair.fromSecret(user.stellarSecretKey);
    const senderAccount = await server.loadAccount(user.stellarPublicKey);
    const asset = currency === "USDC" ? USDC_ASSET : StellarSdk.Asset.native();
    const paymentAmount = amountFloat.toFixed(7);

    const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: project.treasuryAddress,
          asset,
          amount: paymentAmount,
        })
      )
      .addMemo(StellarSdk.Memo.text(`OF:${projectId.slice(0, 10)}`))
      .setTimeout(300)
      .build();

    transaction.sign(keypair);

    const result = await server.submitTransaction(transaction);
    const txHash = result.hash;

    // Record donation
    const donation = await prisma.donation.create({
      data: {
        projectId,
        userId: session.user.id,
        milestoneId: milestoneId ?? undefined,
        issueId: issueId ?? undefined,
        amount: amountFloat,
        currency,
        stellarTxHash: txHash,
        status: "CONFIRMED",
        message: message ?? undefined,
        anonymous: anonymous ?? false,
        confirmedAt: new Date(),
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        totalRaised: { increment: amountFloat },
        monthlyRaised: { increment: amountFloat },
        supporterCount: { increment: 1 },
      },
    });

    if (milestoneId) {
      await prisma.milestone.update({
        where: { id: milestoneId },
        data: { totalRaised: { increment: amountFloat } },
      }).catch(() => {});
    }

    if (issueId) {
      await prisma.fundedIssue.update({
        where: { id: issueId },
        data: { totalRaised: { increment: amountFloat } },
      }).catch(() => {});
    }

    await prisma.notification.create({
      data: {
        userId: project.ownerId,
        projectId,
        type: "DONATION_RECEIVED",
        title: "New Donation Received",
        body: `${anonymous ? "Anonymous" : user.name ?? "Someone"} donated ${amount} ${currency} to ${project.name}`,
        data: { donationId: donation.id, amount, currency, txHash },
      },
    }).catch(() => {});

    // Award first donation badge
    const donationCount = await prisma.donation.count({
      where: { userId: session.user.id, status: "CONFIRMED" },
    });
    if (donationCount === 1) {
      await prisma.userBadge.upsert({
        where: { userId_badge: { userId: session.user.id, badge: "FIRST_DONATION" } },
        update: {},
        create: { userId: session.user.id, badge: "FIRST_DONATION" },
      }).catch(() => {});
    }

    return NextResponse.json({ txHash, donationId: donation.id }, { status: 201 });
  } catch (err) {
    console.error("[stellar/donate] error:", err);
    const stellarErr = err as { response?: { data?: { extras?: { result_codes?: unknown } } }; message?: string };
    const codes = stellarErr.response?.data?.extras?.result_codes;
    if (codes) {
      const codeStr = JSON.stringify(codes);
      // Friendly messages for common result codes
      if (codeStr.includes("op_no_trust")) {
        return NextResponse.json(
          { error: "USDC trust line not set up. Try donating with XLM instead." },
          { status: 400 }
        );
      }
      if (codeStr.includes("op_underfunded") || codeStr.includes("UNDERFUNDED")) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }
      return NextResponse.json(
        { error: "Stellar transaction failed", details: codes },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: stellarErr.message ?? "Transaction failed" },
      { status: 500 }
    );
  }
}
