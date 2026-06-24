import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  getRepo,
  getRepoLanguages,
  getMilestones,
  getContributors,
  getReleases,
  getIssues,
  calculateHealthScore,
} from "@/lib/github";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project || project.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { githubAccessToken: true },
  });

  const token = user?.githubAccessToken ?? undefined;

  const [repo, languages, milestones, contributors, releases, goodFirstIssues] =
    await Promise.all([
      getRepo(project.githubOwner, project.githubRepo, token),
      getRepoLanguages(project.githubOwner, project.githubRepo, token),
      getMilestones(project.githubOwner, project.githubRepo, token),
      getContributors(project.githubOwner, project.githubRepo, token),
      getReleases(project.githubOwner, project.githubRepo, token),
      getIssues(project.githubOwner, project.githubRepo, "good+first+issue", token),
    ]);

  const healthScore = calculateHealthScore(repo);

  await prisma.project.update({
    where: { id: project.id },
    data: {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      watchers: repo.watchers_count,
      language: repo.language ?? undefined,
      languages: languages as Record<string, number>,
      topics: repo.topics ?? [],
      healthScore,
      lastGithubSync: new Date(),
    },
  });

  // Upsert contributors
  for (const c of contributors.slice(0, 20)) {
    await prisma.contributor.upsert({
      where: { projectId_githubLogin: { projectId: project.id, githubLogin: c.login } },
      update: { contributions: c.contributions, avatarUrl: c.avatar_url },
      create: {
        projectId: project.id,
        githubLogin: c.login,
        avatarUrl: c.avatar_url,
        profileUrl: c.html_url,
        contributions: c.contributions,
      },
    });
  }

  // Upsert milestones
  for (const [i, m] of milestones.entries()) {
    await prisma.milestone.upsert({
      where: {
        id: (await prisma.milestone.findFirst({
          where: { projectId: project.id, githubId: m.id.toString() },
          select: { id: true },
        }))?.id ?? "new",
      },
      update: {
        title: m.title,
        description: m.description ?? undefined,
        dueDate: m.due_on ? new Date(m.due_on) : undefined,
        completedAt: m.closed_at ? new Date(m.closed_at) : undefined,
        status: m.state === "closed" ? "COMPLETED" : "OPEN",
        issueCount: m.open_issues + m.closed_issues,
        closedCount: m.closed_issues,
        progress: m.open_issues + m.closed_issues > 0
          ? Math.round((m.closed_issues / (m.open_issues + m.closed_issues)) * 100)
          : 0,
      },
      create: {
        projectId: project.id,
        githubId: m.id.toString(),
        title: m.title,
        description: m.description ?? undefined,
        dueDate: m.due_on ? new Date(m.due_on) : undefined,
        completedAt: m.closed_at ? new Date(m.closed_at) : undefined,
        status: m.state === "closed" ? "COMPLETED" : "OPEN",
        issueCount: m.open_issues + m.closed_issues,
        closedCount: m.closed_issues,
        progress: m.open_issues + m.closed_issues > 0
          ? Math.round((m.closed_issues / (m.open_issues + m.closed_issues)) * 100)
          : 0,
        order: i,
      },
    });
  }

  // Upsert releases
  for (const r of releases) {
    const existing = await prisma.release.findFirst({
      where: { projectId: project.id, githubId: r.id.toString() },
    });
    if (!existing) {
      await prisma.release.create({
        data: {
          projectId: project.id,
          githubId: r.id.toString(),
          tagName: r.tag_name,
          name: r.name ?? undefined,
          body: r.body ?? undefined,
          url: r.html_url,
          prerelease: r.prerelease,
          publishedAt: r.published_at ? new Date(r.published_at) : undefined,
        },
      });
    }
  }

  // Upsert good first issues
  for (const issue of goodFirstIssues.slice(0, 15)) {
    const existing = await prisma.fundedIssue.findFirst({
      where: { projectId: project.id, githubId: issue.id.toString() },
    });
    if (!existing) {
      await prisma.fundedIssue.create({
        data: {
          projectId: project.id,
          githubId: issue.id.toString(),
          number: issue.number,
          title: issue.title,
          description: issue.body ?? undefined,
          url: issue.html_url,
          labels: issue.labels.map((l) => l.name),
          state: issue.state,
        },
      });
    }
  }

  return NextResponse.json({ success: true, healthScore });
}
