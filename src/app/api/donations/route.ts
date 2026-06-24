import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { server } from "@/lib/stellar";
import * as StellarSdk from "@stellar/stellar-sdk";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    projectId: string;
    amount: string;
    currency: string;
    signedXdr?: string;
    message?: string;
    anonymous?: boolean;
    milestoneId?: string;
    issueId?: string;
    devMode?: boolean;
  };
  const {
    projectId,
    amount,
    currency,
    signedXdr,
    message,
    anonymous,
    milestoneId,
    issueId,
    devMode,
  } = body;

  // Dev mode: skip Stellar, record a test donation directly
  if (devMode && process.env.NODE_ENV !== "production") {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const amountDecimal = parseFloat(amount);
    const txHash = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const donation = await prisma.donation.create({
      data: {
        projectId,
        userId: session.user.id,
        milestoneId: milestoneId ?? undefined,
        issueId: issueId ?? undefined,
        amount: amountDecimal,
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
        totalRaised: { increment: amountDecimal },
        monthlyRaised: { increment: amountDecimal },
        supporterCount: { increment: 1 },
      },
    });

    await prisma.notification.create({
      data: {
        userId: project.ownerId,
        projectId,
        type: "DONATION_RECEIVED",
        title: "New Donation Received",
        body: `${anonymous ? "Anonymous" : session.user.name ?? "Someone"} donated ${amount} ${currency} (dev test)`,
        data: { donationId: donation.id, amount, currency, txHash },
      },
    }).catch(() => {});

    return NextResponse.json({ donation, txHash }, { status: 201 });
  }

  if (!projectId || !amount || !currency || !signedXdr) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Submit transaction to Stellar
  let txHash: string;
  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      process.env.STELLAR_NETWORK === "mainnet"
        ? StellarSdk.Networks.PUBLIC
        : StellarSdk.Networks.TESTNET
    );
    const result = await server.submitTransaction(tx as StellarSdk.Transaction);
    txHash = result.hash;
  } catch (err) {
    const stellarError = err as { response?: { data?: { extras?: { result_codes?: unknown } } } };
    return NextResponse.json(
      {
        error: "Stellar transaction failed",
        details: stellarError.response?.data?.extras?.result_codes,
      },
      { status: 400 }
    );
  }

  // Record donation
  const amountDecimal = parseFloat(amount);

  const donation = await prisma.donation.create({
    data: {
      projectId,
      userId: session.user.id,
      milestoneId: milestoneId ?? undefined,
      issueId: issueId ?? undefined,
      amount: amountDecimal,
      currency,
      stellarTxHash: txHash,
      status: "CONFIRMED",
      message: message ?? undefined,
      anonymous: anonymous ?? false,
      confirmedAt: new Date(),
    },
  });

  // Update project totals
  await prisma.project.update({
    where: { id: projectId },
    data: {
      totalRaised: { increment: amountDecimal },
      monthlyRaised: { increment: amountDecimal },
      supporterCount: { increment: 1 },
    },
  });

  // Update milestone if applicable
  if (milestoneId) {
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: { totalRaised: { increment: amountDecimal } },
    });
  }

  // Update issue if applicable
  if (issueId) {
    await prisma.fundedIssue.update({
      where: { id: issueId },
      data: { totalRaised: { increment: amountDecimal } },
    });
  }

  // Create notification for maintainer
  await prisma.notification.create({
    data: {
      userId: project.ownerId,
      projectId,
      type: "DONATION_RECEIVED",
      title: "New Donation Received",
      body: `${anonymous ? "Anonymous" : session.user.name ?? "Someone"} donated ${amount} ${currency} to ${project.name}`,
      data: { donationId: donation.id, amount, currency, txHash },
    },
  }).catch(() => {});

  // Check and award badges
  const donationCount = await prisma.donation.count({
    where: { userId: session.user.id, status: "CONFIRMED" },
  });

  const badgesToAward = [];
  if (donationCount === 1) badgesToAward.push("FIRST_DONATION");

  const projectsSupported = await prisma.donation.groupBy({
    by: ["projectId"],
    where: { userId: session.user.id, status: "CONFIRMED" },
  });
  if (projectsSupported.length >= 5) badgesToAward.push("FUNDED_5_PROJECTS");
  if (projectsSupported.length >= 10) badgesToAward.push("FUNDED_10_PROJECTS");

  for (const badge of badgesToAward) {
    await prisma.userBadge.upsert({
      where: { userId_badge: { userId: session.user.id, badge: badge as never } },
      update: {},
      create: { userId: session.user.id, badge: badge as never },
    }).catch(() => {});
  }

  return NextResponse.json({ donation, txHash }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const projectId = searchParams.get("projectId");
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const where: Record<string, unknown> = { status: "CONFIRMED" };
  if (projectId) where.projectId = projectId;

  const donations = await prisma.donation.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, image: true, githubUsername: true } },
      project: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ donations });
}
