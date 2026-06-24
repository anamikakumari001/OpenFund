import { prisma } from "@/lib/prisma";
import { Hero } from "@/components/landing/hero";
import { TrendingProjects } from "@/components/landing/trending-projects";
import { FeaturesSection } from "@/components/landing/features-section";
import { CTASection } from "@/components/landing/cta-section";
import type { ProjectCardData } from "@/types";

async function getFeaturedProjects(): Promise<ProjectCardData[]> {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "ACTIVE" },
      include: {
        owner: { select: { id: true, name: true, image: true, githubUsername: true } },
      },
      orderBy: [{ featured: "desc" }, { supporterCount: "desc" }, { stars: "desc" }],
      take: 6,
    });

    return projects.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description,
      logoUrl: p.logoUrl,
      stars: p.stars,
      forks: p.forks,
      language: p.language,
      totalRaised: Number(p.totalRaised),
      fundingGoal: p.fundingGoal ? Number(p.fundingGoal) : null,
      supporterCount: p.supporterCount,
      healthScore: p.healthScore,
      category: p.category,
      topics: p.topics,
      owner: {
        name: p.owner.name,
        image: p.owner.image,
        githubUsername: p.owner.githubUsername,
      },
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const projects = await getFeaturedProjects();

  return (
    <div className="bg-white">
      <Hero />
      <TrendingProjects projects={projects} />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}
