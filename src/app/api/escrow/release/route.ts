import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { releaseMilestoneEscrow } from "@/lib/escrow";

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

  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        select: {
          id: true,
          ownerId: true,
          owner: { select: { stellarSecretKey: true } },
        },
      },
    },
  });

  if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  if (milestone.project.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Only the project owner can release escrow" }, { status: 403 });
  }
  if (milestone.escrowReleased) {
    return NextResponse.json({ error: "Already released" }, { status: 400 });
  }
  if (milestone.escrowCancelled) {
    return NextResponse.json({ error: "Escrow was cancelled" }, { status: 400 });
  }
  if (Number(milestone.escrowBalance) === 0) {
    return NextResponse.json({ error: "No escrowed funds" }, { status: 400 });
  }

  try {
    const ownerSecret = milestone.project.owner.stellarSecretKey!;
    const contractMilestoneId = milestoneId.slice(0, 10);

    const { txHash } = await releaseMilestoneEscrow(contractMilestoneId, ownerSecret);

    const releasedAmount = milestone.escrowBalance;
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        escrowReleased: true,
        escrowBalance: 0,
        status: "COMPLETED",
        completedAt: new Date(),
        totalRaised: { increment: Number(releasedAmount) },
      },
    });

    await prisma.project.update({
      where: { id: milestone.project.id },
      data: { totalRaised: { increment: Number(releasedAmount) } },
    }).catch(() => {});

    // Update all escrowed donations to "released"
    await prisma.donation.updateMany({
      where: { milestoneId, escrowMode: true, status: "CONFIRMED" },
      data: {},
    });

    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "MILESTONE_COMPLETED",
        title: "Escrow Released",
        body: `${releasedAmount} USDC released to treasury for milestone "${milestone.title}"`,
        data: { milestoneId, txHash, amount: releasedAmount },
      },
    }).catch(() => {});

    return NextResponse.json({ txHash, releasedAmount });
  } catch (err) {
    console.error("[escrow/release]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Release failed" },
      { status: 500 }
    );
  }
}
