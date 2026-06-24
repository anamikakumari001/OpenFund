import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "12");
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "trending";
  const q = searchParams.get("q");

  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: "ACTIVE" };
  if (category && category !== "all") where.category = category;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const orderBy: Record<string, string>[] = [];
  if (sort === "trending") orderBy.push({ supporterCount: "desc" });
  else if (sort === "funded") orderBy.push({ totalRaised: "desc" });
  else if (sort === "stars") orderBy.push({ stars: "desc" });
  else if (sort === "newest") orderBy.push({ createdAt: "desc" });
  else if (sort === "health") orderBy.push({ healthScore: "desc" });

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, image: true, githubUsername: true } },
        _count: { select: { donations: true, watchedBy: true, votes: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return NextResponse.json({
    projects,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    githubOwner,
    githubRepo,
    fundingGoal,
    category,
    longDescription,
  } = body;

  if (!githubOwner || !githubRepo) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { getRepo, getRepoLanguages, getContributors, getReadme, calculateHealthScore } =
    await import("@/lib/github");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { githubAccessToken: true },
  });

  // Also grab the user's Stellar public key for the treasury address
  const userStellar = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stellarPublicKey: true },
  });

  // Fall back to Account table if custom field wasn't populated
  let accessToken = user?.githubAccessToken ?? null;
  if (!accessToken) {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "github" },
      select: { access_token: true },
    });
    accessToken = account?.access_token ?? null;
  }

  const repo = await getRepo(githubOwner, githubRepo, accessToken);
  const languages = await getRepoLanguages(githubOwner, githubRepo, accessToken);
  const contributors = await getContributors(githubOwner, githubRepo, accessToken);
  const readme = await getReadme(githubOwner, githubRepo, accessToken);
  const healthScore = calculateHealthScore(repo);

  const slug = `${githubOwner}-${githubRepo}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

  const existing = await prisma.project.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "Project already exists" }, { status: 409 });
  }

  const project = await prisma.project.create({
    data: {
      slug,
      name: repo.name,
      description: repo.description ?? "",
      longDescription: longDescription ?? "",
      githubRepoId: repo.id.toString(),
      githubOwner,
      githubRepo,
      githubUrl: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      watchers: repo.watchers_count,
      language: repo.language ?? undefined,
      languages: languages as Record<string, number>,
      license: repo.license?.spdx_id ?? undefined,
      topics: repo.topics ?? [],
      website: repo.homepage ?? undefined,
      readme,
      fundingGoal: fundingGoal ? parseFloat(fundingGoal) : undefined,
      category: category ?? "OTHER",
      healthScore,
      ownerId: session.user.id,
      treasuryAddress: userStellar?.stellarPublicKey ?? undefined,
      lastGithubSync: new Date(),
      contributors: {
        create: (Array.isArray(contributors) ? contributors : []).slice(0, 20).map((c) => ({
          githubLogin: c.login,
          avatarUrl: c.avatar_url,
          profileUrl: c.html_url,
          contributions: c.contributions,
        })),
      },
      analytics: { create: {} },
    },
    include: {
      owner: { select: { id: true, name: true, image: true, githubUsername: true } },
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "MAINTAINER" },
  });

  return NextResponse.json({ project }, { status: 201 });
}
