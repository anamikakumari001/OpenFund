import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      owner: {
        select: { id: true, name: true, image: true, githubUsername: true, bio: true },
      },
      milestones: {
        orderBy: { order: "asc" },
        include: {
          project: { select: { ownerId: true, treasuryAddress: true } },
        },
      },
      contributors: {
        orderBy: { contributions: "desc" },
        take: 20,
      },
      releases: {
        orderBy: { publishedAt: "desc" },
        take: 10,
      },
      issues: {
        where: { state: "open" },
        orderBy: { totalRaised: "desc" },
        take: 20,
      },
      _count: {
        select: {
          donations: true,
          watchedBy: true,
          votes: true,
          comments: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Increment page views
  await prisma.projectAnalytics.upsert({
    where: { projectId: project.id },
    update: { pageViews: { increment: 1 } },
    create: { projectId: project.id, pageViews: 1 },
  }).catch(() => {});

  return NextResponse.json({ project });
}
