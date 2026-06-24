"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Star,
  GitFork,
  Users,
  ExternalLink,
  Globe,
  Shield,
  Zap,
  ArrowLeft,
  Code2,
  Target,
  Bug,
  GitBranch,
  Clock,
  Share2,
  Plus,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FundingPanel } from "@/components/project/funding-panel";
import { TreasuryPanel } from "@/components/project/treasury-panel";
import { RoadmapView } from "@/components/project/roadmap-view";
import { ProjectTimeline } from "@/components/project/project-timeline";
import { formatNumber, timeAgo } from "@/lib/utils";
import { DonationModal } from "@/components/donation/donation-modal";
import type { ProjectWithDetails } from "@/types";
import dynamic from "next/dynamic";

const ProjectEcosystem = dynamic(
  () => import("@/components/project/project-ecosystem").then((m) => m.ProjectEcosystem),
  { ssr: false, loading: () => <div className="h-[400px] rounded-2xl bg-gray-100 skeleton" /> }
);

function AddMilestoneForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fundingGoal, setFundingGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title, description, fundingGoal }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setTitle(""); setDescription(""); setFundingGoal(""); setOpen(false);
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium transition-all"
      >
        <Plus className="w-3.5 h-3.5" /> Add Milestone
      </button>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3">
      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Target className="w-4 h-4 text-gray-500" /> New Milestone
      </h4>
      <input
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
        placeholder="Milestone title *"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 h-16 resize-none"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 pr-14"
            placeholder="Funding goal"
            value={fundingGoal}
            onChange={(e) => setFundingGoal(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">USDC</span>
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={() => void submit()}
          disabled={loading || !title.trim()}
          className="flex-1 py-2 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Create Milestone
        </button>
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-sm transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ProjectDetailClient({ project }: { project: ProjectWithDetails }) {
  const { data: session } = useSession();
  const [donateOpen, setDonateOpen] = useState(false);
  const isOwner = session?.user?.id === project.owner.id;

  const languageColors: Record<string, string> = {
    TypeScript: "#3178C6",
    JavaScript: "#F7DF1E",
    Python: "#3572A5",
    Rust: "#DEA584",
    Go: "#00ADD8",
    Java: "#B07219",
    "C++": "#F34B7D",
    Ruby: "#701516",
    Swift: "#F05138",
  };

  const healthColor =
    project.healthScore >= 80
      ? "bg-green-500"
      : project.healthScore >= 60
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="min-h-screen bg-white">
      {/* Project Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          {/* Breadcrumb */}
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Explore
          </Link>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <div className="flex items-start gap-5">
                {/* Logo */}
                <div className="h-16 w-16 rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                  {project.logoUrl ? (
                    <Image src={project.logoUrl} alt={project.name} fill className="object-cover" />
                  ) : (
                    <Zap className="h-7 w-7 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{project.name}</h1>
                    {project.verified && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                        <Shield className="h-3 w-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Verified</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${healthColor}`} />
                      <span className="text-sm text-gray-500">Health {project.healthScore}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={project.owner.image ?? ""} />
                      <AvatarFallback className="text-[10px] bg-gray-100">{project.owner.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <Link
                      href={`/profile/${project.owner.githubUsername}`}
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {project.owner.githubUsername ?? project.owner.name}
                    </Link>
                    <Badge variant="secondary">
                      {project.category.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mb-4">
                    {project.description ?? "No description available."}
                  </p>

                  {project.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {project.topics.slice(0, 8).map((topic) => (
                        <Badge key={topic} variant="secondary" className="rounded">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-500" />
                      <strong className="text-gray-900">{formatNumber(project.stars)}</strong> stars
                    </span>
                    <span className="flex items-center gap-1.5">
                      <GitFork className="h-4 w-4" />
                      <strong className="text-gray-900">{formatNumber(project.forks)}</strong> forks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <strong className="text-gray-900">{project.contributors.length}</strong> contributors
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bug className="h-4 w-4 text-amber-500" />
                      <strong className="text-gray-900">{project.openIssues}</strong> open issues
                    </span>
                    {project.language && (
                      <span className="flex items-center gap-1.5">
                        <Code2 className="h-4 w-4" />
                        <span
                          className="font-medium"
                          style={{ color: languageColors[project.language] ?? "#6B7280" }}
                        >
                          {project.language}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mt-6">
                <a href={project.githubUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <GitBranch className="h-4 w-4" />
                    View on GitHub
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </a>
                {project.website && (
                  <a href={project.website} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm" className="gap-2">
                      <Globe className="h-4 w-4" />
                      Website
                    </Button>
                  </a>
                )}
                {project.license && (
                  <div className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-gray-200 text-xs text-gray-600 bg-white">
                    <Shield className="h-3.5 w-3.5" />
                    {project.license}
                  </div>
                )}
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined") {
                      navigator.clipboard.writeText(window.location.href);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 text-xs transition-all hover:bg-gray-50"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList className="mb-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="milestones">
                  Milestones
                  {project.milestones.length > 0 && (
                    <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                      {project.milestones.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="contributors">Contributors</TabsTrigger>
                <TabsTrigger value="releases">Releases</TabsTrigger>
                <TabsTrigger value="ecosystem">Ecosystem</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="space-y-5">
                  {project.readme && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-gray-500" />
                        README
                      </h3>
                      <pre className="whitespace-pre-wrap text-xs text-gray-500 font-sans leading-relaxed line-clamp-20 overflow-hidden">
                        {project.readme.slice(0, 2000)}
                        {project.readme.length > 2000 && "\n\n..."}
                      </pre>
                    </div>
                  )}

                  <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      Project Timeline
                    </h3>
                    <ProjectTimeline
                      releases={project.releases}
                      createdAt={project.createdAt}
                      stars={project.stars}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="milestones">
                <div className="space-y-4">
                  {isOwner && <AddMilestoneForm projectId={project.id} />}
                  <RoadmapView milestones={project.milestones} project={project} />
                </div>
              </TabsContent>

              <TabsContent value="issues">
                <div className="space-y-3">
                  {project.issues.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <Bug className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No funded issues yet</p>
                    </div>
                  ) : (
                    project.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <a
                              href={issue.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              #{issue.number} {issue.title}
                            </a>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {issue.labels.map((label) => (
                                <Badge key={label} variant="secondary" className="text-[10px] h-4">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {Number(issue.totalRaised) > 0 && (
                            <Badge variant="success" className="shrink-0">
                              {Number(issue.totalRaised).toFixed(0)} USDC funded
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="text-xs h-7"
                          onClick={() => setDonateOpen(true)}
                        >
                          Fund This Issue
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="contributors">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {project.contributors.map((contributor) => (
                    <a
                      key={contributor.id}
                      href={contributor.profileUrl ?? `https://github.com/${contributor.githubLogin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-all"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={contributor.avatarUrl ?? ""} />
                        <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                          {contributor.githubLogin[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{contributor.githubLogin}</p>
                        <p className="text-xs text-gray-400">{contributor.contributions} commits</p>
                      </div>
                    </a>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="releases">
                <div className="space-y-3">
                  {project.releases.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                      <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No releases yet</p>
                    </div>
                  ) : (
                    project.releases.map((release) => (
                      <div
                        key={release.id}
                        className="p-4 rounded-2xl border border-gray-200 bg-white"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{release.tagName}</Badge>
                            {release.prerelease && (
                              <Badge variant="warning">Pre-release</Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {release.publishedAt ? timeAgo(release.publishedAt) : "Draft"}
                          </span>
                        </div>
                        {release.name && (
                          <p className="text-sm text-gray-900 mb-1">{release.name}</p>
                        )}
                        {release.body && (
                          <p className="text-xs text-gray-500 line-clamp-3">{release.body}</p>
                        )}
                        <a
                          href={release.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2 hover:text-blue-800"
                        >
                          View on GitHub <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="ecosystem">
                <ProjectEcosystem project={project} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">
            <FundingPanel project={project} />
            {project.treasuryAddress && (
              <TreasuryPanel
                address={project.treasuryAddress}
                projectId={project.id}
              />
            )}

            {/* Recent supporters */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Recent Supporters
              </h3>
              <div className="flex items-center -space-x-1">
                {project.contributors.slice(0, 8).map((c) => (
                  <Avatar key={c.id} className="h-8 w-8 ring-2 ring-white">
                    <AvatarImage src={c.avatarUrl ?? ""} />
                    <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                      {c.githubLogin[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.supporterCount > 8 && (
                  <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500 ring-2 ring-white">
                    +{project.supporterCount - 8}
                  </div>
                )}
              </div>
              {project.supporterCount === 0 && (
                <p className="text-sm text-gray-400">No supporters yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <DonationModal
        project={project}
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
      />
    </div>
  );
}
