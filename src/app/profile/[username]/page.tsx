import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  GitBranch,
  Globe,
  MessageCircle,
  MapPin,
  Star,
  Heart,
  Trophy,
  Activity,
  FolderGit2,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { WalletCard } from "@/components/wallet/wallet-card";

interface Props {
  params: Promise<{ username: string }>;
}

const BADGE_META: Record<string, { label: string; color: "default" | "success" | "violet" | "warning" | "danger" | "secondary" | "outline" }> = {
  FIRST_DONATION:       { label: "First Donation",       color: "success" },
  FUNDED_5_PROJECTS:    { label: "5 Projects Funded",    color: "default" },
  FUNDED_10_PROJECTS:   { label: "10 Projects Funded",   color: "violet" },
  FUNDED_MILESTONE:     { label: "Milestone Funder",     color: "warning" },
  FUNDED_10_MILESTONES: { label: "Milestone Legend",     color: "warning" },
  OPEN_SOURCE_CHAMPION: { label: "OSS Champion",         color: "success" },
  EARLY_ADOPTER:        { label: "Early Adopter",        color: "violet" },
  TOP_SUPPORTER:        { label: "Top Supporter",        color: "default" },
  VERIFIED_MAINTAINER:  { label: "Verified Maintainer",  color: "success" },
  LEGEND:               { label: "Legend",               color: "warning" },
};

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { githubUsername: username },
    select: {
      id: true, name: true, image: true, bio: true, website: true,
      location: true, twitterUsername: true, githubUsername: true,
      role: true, createdAt: true, stellarPublicKey: true,
    },
  });

  if (!user) notFound();

  const [projects, donations, badges, userCount, uniqueProjectsFunded] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: user.id, status: "ACTIVE" },
      orderBy: { totalRaised: "desc" },
      select: {
        id: true, slug: true, name: true, description: true, totalRaised: true,
        fundingGoal: true, supporterCount: true, healthScore: true, language: true,
        stars: true, status: true, createdAt: true,
        _count: { select: { donations: true } },
      },
    }),
    prisma.donation.findMany({
      where: { userId: user.id, status: "CONFIRMED", anonymous: false },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, amount: true, currency: true, createdAt: true,
        project: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.userBadge.findMany({ where: { userId: user.id }, orderBy: { earnedAt: "desc" } }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { _count: { select: { projects: true, donations: true, badges: true } } },
    }),
    prisma.donation.groupBy({
      by: ["projectId"],
      where: { userId: user.id, status: "CONFIRMED" },
    }),
  ]);

  const isOwner = session?.user?.id === user.id;
  const totalDonated = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalRaised = projects.reduce((sum, p) => sum + Number(p.totalRaised), 0);
  const _count = userCount?._count ?? { projects: 0, donations: 0, badges: 0 };

  const initials = (user.name ?? username)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Profile Header */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <Avatar className="w-20 h-20 rounded-2xl flex-shrink-0">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? username} />
              <AvatarFallback className="rounded-2xl bg-gray-100 text-gray-600 text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900">
                  {user.name ?? username}
                </h1>
                <Badge variant={user.role === "MAINTAINER" ? "success" : user.role === "ADMIN" ? "danger" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 mb-2">@{username}</p>
              {user.bio && (
                <p className="text-sm text-gray-600 mb-3 max-w-xl">{user.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                <a
                  href={`https://github.com/${username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  GitHub
                </a>
                {user.website && (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
                {user.twitterUsername && (
                  <a
                    href={`https://twitter.com/${user.twitterUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-gray-900 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />@{user.twitterUsername}
                  </a>
                )}
                {user.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.location}
                  </span>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-400 sm:text-right shrink-0">
              Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        {user.stellarPublicKey && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              {isOwner ? "My Wallet" : "Stellar Wallet"}
            </h2>
            <WalletCard address={user.stellarPublicKey} isOwner={isOwner} />
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: FolderGit2, label: "Projects",          value: _count.projects },
            { icon: Heart,      label: "Projects Supported", value: uniqueProjectsFunded.length },
            { icon: Star,       label: "Total Donated",      value: `$${totalDonated.toFixed(0)}` },
            { icon: Activity,   label: "Total Raised",       value: `$${totalRaised.toFixed(0)}` },
          ].map((item) => (
            <Card key={item.label} className="p-4">
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
                <item.icon className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <p className="text-xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
            </Card>
          ))}
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="p-5 rounded-2xl bg-white border border-gray-200 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Badges
            </h2>
            <div className="flex flex-wrap gap-2">
              {badges.map((ub) => {
                const meta = BADGE_META[ub.badge] ?? { label: ub.badge, color: "secondary" as const };
                return (
                  <Badge key={ub.id} variant={meta.color}>
                    {meta.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-gray-500" />
              Projects
              <span className="text-sm text-gray-400 font-normal">({projects.length})</span>
            </h2>
            {projects.length === 0 ? (
              <Card className="p-8 flex flex-col items-center justify-center">
                <FolderGit2 className="w-7 h-7 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No public projects yet</p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {projects.map((project) => (
                  <Card key={project.id} className="p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <Link
                          href={`/project/${project.slug}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {project.name}
                        </Link>
                        {project.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {project.language && (
                          <Badge variant="secondary" className="text-[10px]">
                            {project.language}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Star className="w-3 h-3" />
                          {project.stars}
                        </span>
                      </div>
                    </div>

                    {project.fundingGoal && Number(project.fundingGoal) > 0 && (
                      <div>
                        <Progress value={Number(project.totalRaised)} max={Number(project.fundingGoal)} />
                        <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                          <span>${Number(project.totalRaised).toFixed(2)} raised</span>
                          <span>Goal: ${Number(project.fundingGoal).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {project.supporterCount} supporters
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Health {project.healthScore}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Supporting */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-gray-500" />
              Supporting
              <span className="text-sm text-gray-400 font-normal">({uniqueProjectsFunded.length} projects)</span>
            </h2>
            {donations.length === 0 ? (
              <Card className="p-8 flex flex-col items-center justify-center">
                <Heart className="w-7 h-7 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No public donations yet</p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {donations.map((donation) => (
                  <Card key={donation.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Link
                          href={`/project/${donation.project.slug}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {donation.project.name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 font-mono">
                        ${Number(donation.amount).toFixed(2)}{" "}
                        <span className="text-xs text-gray-400 font-sans">{donation.currency}</span>
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Impact Metrics</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Total Donated",   value: `$${totalDonated.toFixed(2)}` },
                  { label: "Projects Backed", value: uniqueProjectsFunded.length },
                  { label: "Badges Earned",   value: _count.badges },
                  { label: "Donations Made",  value: _count.donations },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="p-3 rounded-xl bg-white border border-gray-200"
                  >
                    <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                    <p className="text-xs text-gray-400">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
