import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMilestoneEscrowInfo, getDonorEscrowAmount } from "@/lib/escrow";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  const { milestoneId } = await params;
  const session = await auth();

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: {
      id: true,
      title: true,
      escrowBalance: true,
      escrowReleased: true,
      escrowCancelled: true,
      project: { select: { ownerId: true, treasuryAddress: true } },
    },
  });

  if (!milestone) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const contractMilestoneId = milestoneId.slice(0, 10);
  const [onChainInfo, donorAmount] = await Promise.all([
    getMilestoneEscrowInfo(contractMilestoneId),
    session?.user?.id
      ? (async () => {
          const donor = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { stellarPublicKey: true },
          });
          return donor?.stellarPublicKey
            ? getDonorEscrowAmount(contractMilestoneId, donor.stellarPublicKey)
            : 0;
        })()
      : Promise.resolve(0),
  ]);

  return NextResponse.json({
    milestoneId,
    dbBalance: Number(milestone.escrowBalance),
    released: milestone.escrowReleased,
    cancelled: milestone.escrowCancelled,
    isOwner: milestone.project.ownerId === session?.user?.id,
    onChain: onChainInfo,
    donorAmount,
  });
}
