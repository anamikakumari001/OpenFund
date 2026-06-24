import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const [user, projects, recentDonations] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        image: true,
        githubUsername: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true, donations: true, badges: true } },
      },
    }),
    prisma.project.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: { select: { donations: true, watchedBy: true } },
        analytics: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.donation.findMany({
      where: {
        project: { ownerId: session.user.id },
        status: "CONFIRMED",
      },
      include: {
        user: { select: { id: true, name: true, image: true, githubUsername: true } },
        project: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!user) redirect("/");

  const totalRaised = projects.reduce(
    (sum, p) => sum + Number(p.totalRaised),
    0
  );
  const totalSupporters = projects.reduce((sum, p) => sum + p.supporterCount, 0);
  const avgHealthScore =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + p.healthScore, 0) / projects.length
        )
      : 0;

  // Build 12-month funding trend from donations
  const now = new Date();
  const trendData: { month: string; raised: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendData.push({
      month: d.toLocaleString("default", { month: "short" }),
      raised: 0,
    });
  }

  const allDonations = await prisma.donation.findMany({
    where: {
      project: { ownerId: session.user.id },
      status: "CONFIRMED",
      createdAt: {
        gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
      },
    },
    select: { amount: true, createdAt: true },
  });

  for (const donation of allDonations) {
    const donationMonth = new Date(donation.createdAt).toLocaleString("default", {
      month: "short",
    });
    const idx = trendData.findIndex((t) => t.month === donationMonth);
    if (idx !== -1) {
      trendData[idx].raised += Number(donation.amount);
    }
  }

  const stats = { totalRaised, totalSupporters, avgHealthScore };

  return (
    <DashboardClient
      user={user}
      projects={projects.map((p) => ({
        ...p,
        totalRaised: Number(p.totalRaised),
        monthlyRaised: Number(p.monthlyRaised),
        fundingGoal: p.fundingGoal ? Number(p.fundingGoal) : null,
      }))}
      recentDonations={recentDonations.map((d) => ({
        ...d,
        amount: Number(d.amount),
      }))}
      stats={stats}
      trendData={trendData}
    />
  );
}
