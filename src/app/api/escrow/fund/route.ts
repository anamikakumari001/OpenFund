import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fundMilestoneEscrow, initMilestone } from "@/lib/escrow";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    milestoneId: string;
    amount: string;     // USDC amount
    message?: string;
    anonymous?: boolean;
  };

  const { milestoneId, amount, message, anonymous } = body;
  if (!milestoneId || !amount) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const amountFloat = parseFloat(amount);
  if (isNaN(amountFloat) || amountFloat < 1) {
    return NextResponse.json({ error: "Minimum escrow amount is 1 USDC" }, { status: 400 });
  }

  // Load donor wallet
  const donor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stellarPublicKey: true, stellarSecretKey: true, name: true },
  });
  if (!donor?.stellarPublicKey || !donor.stellarSecretKey) {
    return NextResponse.json({ error: "No Stellar wallet. Sign out and back in." }, { status: 400 });
  }

  // Load milestone and project
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          treasuryAddress: true,
          owner: { select: { stellarSecretKey: true, stellarPublicKey: true } },
        },
      },
    },
  });
  if (!milestone) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }
  if (milestone.escrowReleased) {
    return NextResponse.json({ error: "Milestone escrow already released" }, { status: 400 });
  }
  if (milestone.escrowCancelled) {
    return NextResponse.json({ error: "Milestone escrow cancelled — use refund" }, { status: 400 });
  }
  if (milestone.project.ownerId === session.user.id) {
    return NextResponse.json({ error: "Cannot fund your own milestone" }, { status: 400 });
  }

  const treasury = milestone.project.treasuryAddress;
  if (!treasury) {
    return NextResponse.json({ error: "Project has no treasury address" }, { status: 400 });
  }

  try {
    // If this is the first fund, init the milestone escrow slot on-chain
    // Use the contract milestone ID as a short symbol (max 10 chars)
    const contractMilestoneId = milestoneId.slice(0, 10);
    const ownerSecret = milestone.project.owner.stellarSecretKey!;
    const ownerPublicKey = milestone.project.owner.stellarPublicKey!;

    // Idempotent: init only if balance is 0 (first funder)
    if (Number(milestone.escrowBalance) === 0) {
      try {
        await initMilestone(contractMilestoneId, ownerSecret, ownerPublicKey, treasury);
      } catch (e: unknown) {
        // "already initialized" is OK — another donor beat us to it
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("already initialized")) throw e;
      }
    }

    // Fund the escrow
    const { txHash } = await fundMilestoneEscrow(
      contractMilestoneId,
      donor.stellarSecretKey,
      donor.stellarPublicKey,
      amountFloat
    );

    // Record donation and update DB
    const donation = await prisma.donation.create({
      data: {
        projectId: milestone.project.id,
        userId: session.user.id,
        milestoneId,
        amount: amountFloat,
        currency: "USDC",
        stellarTxHash: txHash,
        status: "CONFIRMED",
        escrowMode: true,
        message: message ?? undefined,
        anonymous: anonymous ?? false,
        confirmedAt: new Date(),
      },
    });

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { escrowBalance: { increment: amountFloat } },
    });

    await prisma.project.update({
      where: { id: milestone.project.id },
      data: { supporterCount: { increment: 1 } },
    });

    await prisma.notification.create({
      data: {
        userId: milestone.project.ownerId,
        projectId: milestone.project.id,
        type: "DONATION_RECEIVED",
        title: "Milestone Escrow Funded",
        body: `${anonymous ? "Anonymous" : donor.name ?? "Someone"} locked ${amount} USDC in escrow for "${milestone.title}"`,
        data: { donationId: donation.id, amount, txHash, milestoneId },
      },
    }).catch(() => {});

    return NextResponse.json({ txHash, donationId: donation.id }, { status: 201 });
  } catch (err) {
    console.error("[escrow/fund]", err);
    const msg = err instanceof Error ? err.message : "Escrow transaction failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
