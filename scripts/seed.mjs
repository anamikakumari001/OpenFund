#!/usr/bin/env node
/**
 * Seed script — populates the DB with a demo user + realistic projects.
 * Run: node scripts/seed.mjs
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GH_TOKEN = process.env.GITHUB_DEV_TOKEN;

async function fetchGitHub(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: GH_TOKEN ? `Bearer ${GH_TOKEN}` : "",
      "User-Agent": "openfund-seed",
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) return null;
  return res.json();
}

const DEMO_PROJECTS = [
  { owner: "vercel", repo: "next.js", category: "FRAMEWORKS", goal: 50000, featured: true },
  { owner: "vitejs", repo: "vite", category: "DEVELOPER_TOOLS", goal: 30000, featured: true },
  { owner: "supabase", repo: "supabase", category: "INFRASTRUCTURE", goal: 75000, featured: true },
  { owner: "trpc", repo: "trpc", category: "FRAMEWORKS", goal: 20000 },
  { owner: "prisma", repo: "prisma", category: "DEVELOPER_TOOLS", goal: 60000 },
  { owner: "tailwindlabs", repo: "tailwindcss", category: "FRAMEWORKS", goal: 40000, featured: true },
  { owner: "shadcn-ui", repo: "ui", category: "LIBRARIES", goal: 15000 },
  { owner: "pmndrs", repo: "zustand", category: "LIBRARIES", goal: 10000 },
  { owner: "tanstack", repo: "query", category: "LIBRARIES", goal: 25000 },
  { owner: "stellar", repo: "stellar-core", category: "BLOCKCHAIN", goal: 100000, featured: true },
  { owner: "biomejs", repo: "biome", category: "DEVELOPER_TOOLS", goal: 20000 },
  { owner: "oxc-project", repo: "oxc", category: "DEVELOPER_TOOLS", goal: 15000 },
];

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌱 Seeding OpenFund database...\n");

  // ── 1. Create / fetch demo maintainer user ──────────────────────────────
  let ghUser = null;
  if (GH_TOKEN) {
    ghUser = await fetchGitHub("/user");
    console.log(`✓ GitHub user: ${ghUser?.login ?? "anonymous"}`);
  }

  const demoUser = await prisma.user.upsert({
    where: { githubUsername: ghUser?.login ?? "demo-maintainer" },
    update: {
      name: ghUser?.name ?? "Demo Maintainer",
      image: ghUser?.avatar_url ?? "https://avatars.githubusercontent.com/u/1?v=4",
      githubAccessToken: GH_TOKEN,
    },
    create: {
      name: ghUser?.name ?? "Demo Maintainer",
      email: ghUser?.email ?? "demo@openfund.dev",
      image: ghUser?.avatar_url ?? "https://avatars.githubusercontent.com/u/1?v=4",
      githubUsername: ghUser?.login ?? "demo-maintainer",
      githubId: String(ghUser?.id ?? 999999),
      githubAccessToken: GH_TOKEN,
      role: "MAINTAINER",
    },
  });
  console.log(`✓ User ready: ${demoUser.name} (${demoUser.id})\n`);

  // ── 2. Seed projects ────────────────────────────────────────────────────
  const createdProjects = [];
  for (const def of DEMO_PROJECTS) {
    const existing = await prisma.project.findFirst({
      where: { githubOwner: def.owner, githubRepo: def.repo },
    });
    if (existing) {
      console.log(`  → already exists: ${def.owner}/${def.repo}`);
      createdProjects.push(existing);
      continue;
    }

    let repoData = null;
    if (GH_TOKEN) {
      repoData = await fetchGitHub(`/repos/${def.owner}/${def.repo}`);
    }

    const name = repoData?.name ?? def.repo;
    const description = repoData?.description ?? `${name} – open source project`;
    const stars = repoData?.stargazers_count ?? randomBetween(1000, 50000);
    const forks = repoData?.forks_count ?? randomBetween(100, 5000);
    const language = repoData?.language ?? "TypeScript";
    const topics = repoData?.topics ?? [];
    const website = repoData?.homepage ?? null;
    const githubUrl = repoData?.html_url ?? `https://github.com/${def.owner}/${def.repo}`;

    const totalRaised = randomBetween(Math.floor(def.goal * 0.1), Math.floor(def.goal * 0.85));
    const supporterCount = randomBetween(20, 500);
    const healthScore = randomBetween(65, 98);

    const slug = slugify(`${def.owner}-${def.repo}`);

    const project = await prisma.project.create({
      data: {
        slug,
        name,
        description,
        githubOwner: def.owner,
        githubRepo: def.repo,
        githubUrl,
        stars,
        forks,
        openIssues: repoData?.open_issues_count ?? randomBetween(10, 200),
        watchers: repoData?.watchers_count ?? stars,
        language,
        topics,
        website,
        fundingGoal: def.goal,
        totalRaised,
        monthlyRaised: randomBetween(500, 5000),
        supporterCount,
        healthScore,
        category: def.category,
        status: "ACTIVE",
        featured: def.featured ?? false,
        verified: true,
        ownerId: demoUser.id,
      },
    });

    // Create analytics
    await prisma.projectAnalytics.create({
      data: {
        projectId: project.id,
        pageViews: randomBetween(1000, 50000),
        uniqueVisitors: randomBetween(500, 20000),
        donationCount: supporterCount,
        watcherCount: randomBetween(100, 2000),
        shareCount: randomBetween(50, 500),
      },
    });

    // Create milestones
    const milestoneStatuses = ["COMPLETED", "IN_PROGRESS", "OPEN"];
    for (let i = 0; i < 3; i++) {
      await prisma.milestone.create({
        data: {
          projectId: project.id,
          title: [
            "Initial Release & Core Infrastructure",
            "Performance Optimization & Docs",
            "v2.0 – New Architecture",
          ][i],
          description: "Milestone description with goals and deliverables.",
          status: milestoneStatuses[i],
          fundingGoal: Math.floor(def.goal / 3),
          totalRaised: i === 0 ? Math.floor(def.goal / 3) : randomBetween(0, Math.floor(def.goal / 3)),
          progress: [100, randomBetween(30, 80), randomBetween(0, 20)][i],
          issueCount: randomBetween(5, 20),
          closedCount: i === 0 ? randomBetween(5, 20) : randomBetween(0, 10),
          order: i,
          completedAt: i === 0 ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : null,
          dueDate: i > 0 ? new Date(Date.now() + (i * 60) * 24 * 60 * 60 * 1000) : null,
        },
      });
    }

    // Create contributors
    let ghContributors = [];
    if (GH_TOKEN) {
      const fetched = await fetchGitHub(`/repos/${def.owner}/${def.repo}/contributors?per_page=6`);
      if (Array.isArray(fetched)) ghContributors = fetched;
    }
    if (ghContributors.length === 0) {
      ghContributors = Array.from({ length: 5 }, (_, i) => ({
        login: `contributor-${i + 1}`,
        avatar_url: `https://avatars.githubusercontent.com/u/${randomBetween(1000, 99999)}?v=4`,
        html_url: `https://github.com/contributor-${i + 1}`,
        contributions: randomBetween(10, 500),
      }));
    }
    for (const c of ghContributors.slice(0, 6)) {
      await prisma.contributor.upsert({
        where: { projectId_githubLogin: { projectId: project.id, githubLogin: c.login } },
        update: { contributions: c.contributions },
        create: {
          projectId: project.id,
          githubLogin: c.login,
          avatarUrl: c.avatar_url,
          profileUrl: c.html_url,
          contributions: c.contributions,
        },
      });
    }

    // Create releases
    let ghReleases = [];
    if (GH_TOKEN) {
      const fetched = await fetchGitHub(`/repos/${def.owner}/${def.repo}/releases?per_page=3`);
      if (Array.isArray(fetched)) ghReleases = fetched;
    }
    if (ghReleases.length === 0) {
      ghReleases = [
        { tag_name: "v1.0.0", name: "Initial Release", body: "First stable release.", html_url: githubUrl, prerelease: false, published_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
        { tag_name: "v1.1.0", name: "Minor improvements", body: "Bug fixes and performance improvements.", html_url: githubUrl, prerelease: false, published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
      ];
    }
    for (const r of ghReleases.slice(0, 3)) {
      await prisma.release.create({
        data: {
          projectId: project.id,
          tagName: r.tag_name,
          name: r.name,
          body: r.body,
          url: r.html_url,
          prerelease: r.prerelease ?? false,
          publishedAt: r.published_at ? new Date(r.published_at) : null,
        },
      });
    }

    // Create funded issues
    for (let i = 0; i < 3; i++) {
      await prisma.fundedIssue.create({
        data: {
          projectId: project.id,
          number: randomBetween(100, 9999),
          title: [`Fix memory leak in core`, `Add TypeScript strict mode`, `Improve bundle size`][i],
          url: `${githubUrl}/issues/${randomBetween(100, 999)}`,
          labels: ["bug", "enhancement", "good first issue"].slice(0, i + 1),
          state: i === 0 ? "closed" : "open",
          fundingGoal: randomBetween(200, 2000),
          totalRaised: i === 0 ? randomBetween(200, 2000) : randomBetween(0, 500),
          closedAt: i === 0 ? new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) : null,
        },
      });
    }

    // Create some donations
    const donationCount = randomBetween(5, 15);
    for (let i = 0; i < donationCount; i++) {
      await prisma.donation.create({
        data: {
          projectId: project.id,
          userId: demoUser.id,
          amount: randomBetween(5, 500),
          currency: "USDC",
          status: "CONFIRMED",
          anonymous: Math.random() > 0.7,
          message: Math.random() > 0.5 ? "Great project! Keep it up." : null,
          createdAt: new Date(Date.now() - randomBetween(1, 180) * 24 * 60 * 60 * 1000),
          confirmedAt: new Date(),
        },
      });
    }

    createdProjects.push(project);
    console.log(`  ✓ ${def.owner}/${def.repo} → ${slug} (${stars.toLocaleString()} ★, $${totalRaised.toLocaleString()} raised)`);
  }

  // ── 3. Add badges to demo user ───────────────────────────────────────────
  const badges = ["EARLY_ADOPTER", "FIRST_DONATION", "FUNDED_5_PROJECTS"];
  for (const badge of badges) {
    await prisma.userBadge.upsert({
      where: { userId_badge: { userId: demoUser.id, badge } },
      update: {},
      create: { userId: demoUser.id, badge },
    });
  }

  // ── 4. Create notifications ─────────────────────────────────────────────
  const notifTypes = ["DONATION_RECEIVED", "MILESTONE_COMPLETED", "FUNDING_GOAL_REACHED"];
  for (const project of createdProjects.slice(0, 3)) {
    const type = notifTypes[createdProjects.indexOf(project) % 3];
    await prisma.notification.create({
      data: {
        userId: demoUser.id,
        projectId: project.id,
        type,
        title: type === "DONATION_RECEIVED" ? "New donation received" : type === "MILESTONE_COMPLETED" ? "Milestone completed!" : "Funding goal reached!",
        body: `${project.name} — ${type.toLowerCase().replace(/_/g, " ")}`,
        read: false,
      },
    });
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   ${createdProjects.length} projects`);
  console.log(`   ${createdProjects.length * 3} milestones`);
  console.log(`   ${createdProjects.length * 6} contributors`);
  console.log(`   ${createdProjects.length * 3} releases`);
  console.log(`   ${createdProjects.length * 3} funded issues`);
  console.log(`\n👉 Visit http://localhost:3005 to see it live!\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
