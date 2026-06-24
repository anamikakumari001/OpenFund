import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refundMilestoneEscrow, getDonorEscrowAmount } from "@/lib/escrow";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { milestoneId: string };
  const { milestoneId } = body;
  if (!milestoneId) {
    return NextResponse.json({ error: "Missing milestoneId" }, { status: 400 });
  }

  const donor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stellarPublicKey: true, stellarSecretKey: true },
  });
  if (!donor?.stellarPublicKey || !donor.stellarSecretKey) {
    return NextResponse.json({ error: "No Stellar wallet" }, { status: 400 });
  }

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { project: { select: { id: true } } },
  });
  if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  if (!milestone.escrowCancelled) {
    return NextResponse.json({ error: "Milestone not cancelled — refunds not available" }, { status: 400 });
  }

  // Check on-chain donor amount
  const contractMilestoneId = milestoneId.slice(0, 10);
  const onChainAmount = await getDonorEscrowAmount(contractMilestoneId, donor.stellarPublicKey);
  if (onChainAmount <= 0) {
    return NextResponse.json({ error: "No escrowed funds to refund" }, { status: 400 });
  }

  try {
    const { txHash } = await refundMilestoneEscrow(
      contractMilestoneId,
      donor.stellarSecretKey,
      donor.stellarPublicKey
    );

    // Mark related donations as refunded
    await prisma.donation.updateMany({
      where: {
        milestoneId,
        userId: session.user.id,
        escrowMode: true,
        status: "CONFIRMED",
      },
      data: { status: "REFUNDED" },
    });

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { escrowBalance: { decrement: onChainAmount } },
    });

    return NextResponse.json({ txHash, refundedAmount: onChainAmount });
  } catch (err) {
    console.error("[escrow/refund]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Refund failed" },
      { status: 500 }
    );
  }
}
