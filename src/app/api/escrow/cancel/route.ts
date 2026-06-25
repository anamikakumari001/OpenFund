import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelMilestoneEscrow } from "@/lib/escrow";

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
          ownerId: true,
          owner: { select: { stellarSecretKey: true } },
        },
      },
    },
  });

  if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  if (milestone.project.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Only the project owner can cancel escrow" }, { status: 403 });
  }
  if (milestone.escrowReleased) {
    return NextResponse.json({ error: "Cannot cancel — already released" }, { status: 400 });
  }
  if (milestone.escrowCancelled) {
    return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
  }

  try {
    const ownerSecret = milestone.project.owner.stellarSecretKey!;
    const contractMilestoneId = milestoneId.slice(0, 10);

    const { txHash } = await cancelMilestoneEscrow(contractMilestoneId, ownerSecret);

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        escrowCancelled: true,
        status: "CANCELLED",
      },
    });

    return NextResponse.json({ txHash });
  } catch (err) {
    console.error("[escrow/cancel]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cancel failed" },
      { status: 500 }
    );
  }
}
