import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { ProjectDetailClient } from "./project-detail-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!project) return {};
  return {
    title: project.name,
    description: project.description ?? undefined,
  };
}

async function getProject(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          githubUsername: true,
          bio: true,
          website: true,
        },
      },
      milestones: {
        orderBy: { order: "asc" },
        include: {
          project: { select: { ownerId: true, treasuryAddress: true } },
        },
      },
      contributors: { orderBy: { contributions: "desc" }, take: 20 },
      releases: { orderBy: { publishedAt: "desc" }, take: 10 },
      issues: { orderBy: { totalRaised: "desc" }, take: 20 },
      _count: {
        select: { donations: true, watchedBy: true, votes: true, comments: true },
      },
    },
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  // Increment pageviews (fire-and-forget)
  prisma.projectAnalytics
    .upsert({
      where: { projectId: project.id },
      update: { pageViews: { increment: 1 } },
      create: { projectId: project.id, pageViews: 1 },
    })
    .catch(() => {});

  return <ProjectDetailClient project={project as never} />;
}
