import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface SearchResult {
  id: string;
  type: "project" | "user";
  title: string;
  subtitle: string;
  url: string;
  image: string | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const limit = parseInt(searchParams.get("limit") ?? "8");

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logoUrl: true,
        owner: { select: { name: true } },
      },
      take: limit,
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { githubUsername: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        githubUsername: true,
        image: true,
      },
      take: limit,
    }),
  ]);

  type ProjectRow = (typeof projects)[number];
  type UserRow = (typeof users)[number];

  const projectResults = projects.map((p: ProjectRow) => ({
    id: p.id,
    type: "project" as const,
    title: p.name,
    subtitle: p.description ?? `by ${p.owner.name ?? "unknown"}`,
    url: `/project/${p.slug}`,
    image: p.logoUrl,
  }));

  const userResults = users.map((u: UserRow) => ({
    id: u.id,
    type: "user" as const,
    title: u.name ?? u.githubUsername ?? "Unknown User",
    subtitle: u.githubUsername ? `@${u.githubUsername}` : "",
    url: `/profile/${u.githubUsername ?? u.id}`,
    image: u.image,
  }));

  const results: SearchResult[] = [...projectResults, ...userResults];

  return NextResponse.json({ results, projects: projectResults, users: userResults });
}
