import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { githubUsername: username },
    include: {
      badges: true,
      _count: {
        select: {
          projects: true,
          donations: true,
          watchedProjects: true,
        },
      },
      projects: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          logoUrl: true,
          stars: true,
          totalRaised: true,
          language: true,
          category: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Omit sensitive fields
  const { githubAccessToken, githubId, ...safeUser } = user as typeof user & {
    githubAccessToken?: string | null;
    githubId?: string | null;
  };

  void githubAccessToken;
  void githubId;

  return NextResponse.json({ user: safeUser });
}
