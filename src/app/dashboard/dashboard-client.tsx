"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  FolderGit2,
  Users,
  Activity,
  Plus,
  ExternalLink,
  Heart,
  ChevronRight,
  Zap,
  GitBranch,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface ProjectData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  totalRaised: number;
  monthlyRaised: number;
  fundingGoal: number | null;
  supporterCount: number;
  healthScore: number;
  status: string;
  stars: number;
  language: string | null;
  _count: { donations: number; watchedBy: number };
  analytics: { pageViews: number; uniqueVisitors: number } | null;
}

interface DonationData {
  id: string;
  amount: number;
  currency: string;
  anonymous: boolean;
  message: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null; githubUsername: string | null };
  project: { id: string; name: string; slug: string };
}

interface UserData {
  id: string;
  name: string | null;
  image: string | null;
  githubUsername: string | null;
  role: string;
  createdAt: Date;
  _count: { projects: number; donations: number; badges: number };
}

interface Props {
  user: UserData;
  projects: ProjectData[];
  recentDonations: DonationData[];
  stats: { totalRaised: number; totalSupporters: number; avgHealthScore: number };
  trendData: { month: string; raised: number }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{sub}</p>
      </div>
    </Card>
  );
}

export default function DashboardClient({
  user,
  projects,
  recentDonations,
  stats,
  trendData,
}: Props) {
  const [activeTab, setActiveTab] = useState("overview");

  const initials = (user.name ?? user.githubUsername ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatAmount = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
              <AvatarFallback className="bg-gray-100 text-gray-700 font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user.name?.split(" ")[0] ?? user.githubUsername ?? "Welcome back"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
                {user.githubUsername && (
                  <a
                    href={`https://github.com/${user.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <GitBranch className="w-3 h-3" />
                    @{user.githubUsername}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <Link href="/dashboard/new">
            <Button variant="default" size="default" className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={TrendingUp}
            label="Total Raised"
            value={formatAmount(stats.totalRaised)}
            sub="All time across projects"
          />
          <StatCard
            icon={FolderGit2}
            label="Active Projects"
            value={String(projects.filter((p) => p.status === "ACTIVE").length)}
            sub={`${projects.length} total project${projects.length !== 1 ? "s" : ""}`}
          />
          <StatCard
            icon={Users}
            label="Total Supporters"
            value={String(stats.totalSupporters)}
            sub="Unique backers"
          />
          <StatCard
            icon={Activity}
            label="Avg Health Score"
            value={`${stats.avgHealthScore}/100`}
            sub="Across all projects"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Funding Trend Chart */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  <CardHeader className="p-0 pb-6">
                    <CardTitle className="text-base">Funding Trend</CardTitle>
                    <p className="text-sm text-gray-400 mt-0.5">Last 12 months</p>
                  </CardHeader>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fundingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#111827" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "12px",
                          color: "#111827",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
                        }}
                        formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, "Raised"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="raised"
                        stroke="#111827"
                        strokeWidth={2}
                        fill="url(#fundingGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Recent Donations */}
              <div>
                <Card className="p-6 h-full">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base">Recent Donations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {recentDonations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <Heart className="w-7 h-7 mb-2 opacity-40" />
                        <p className="text-sm">No donations yet</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {recentDonations.map((donation) => (
                          <li key={donation.id} className="flex items-start gap-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={donation.user.image ?? undefined} />
                              <AvatarFallback className="bg-gray-100 text-xs text-gray-600">
                                {donation.anonymous
                                  ? "?"
                                  : (donation.user.name ?? "A")[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-900 font-medium truncate">
                                {donation.anonymous
                                  ? "Anonymous"
                                  : (donation.user.name ?? donation.user.githubUsername ?? "Someone")}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {donation.project.name}
                              </p>
                              <p className="text-[10px] text-gray-300">
                                {formatDistanceToNow(new Date(donation.createdAt), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-gray-900 flex-shrink-0">
                              ${Number(donation.amount).toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Projects Quick View */}
            {projects.length > 0 && (
              <div className="mt-5">
                <Card className="p-6">
                  <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Your Projects</CardTitle>
                    <button
                      onClick={() => setActiveTab("projects")}
                      className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                    >
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </CardHeader>
                  <div className="space-y-2">
                    {projects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/project/${project.slug}`}
                              className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate text-sm"
                            >
                              {project.name}
                            </Link>
                            {project.language && (
                              <Badge variant="secondary" className="text-[10px]">
                                {project.language}
                              </Badge>
                            )}
                          </div>
                          {project.fundingGoal && project.fundingGoal > 0 && (
                            <div className="mt-1">
                              <Progress
                                value={project.totalRaised}
                                max={project.fundingGoal}
                              />
                              <div className="flex justify-between mt-1">
                                <span className="text-[10px] text-gray-400">
                                  {((project.totalRaised / project.fundingGoal) * 100).toFixed(1)}%
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  ${project.totalRaised.toFixed(0)} / ${project.fundingGoal.toFixed(0)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {project.stars}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {project.supporterCount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* PROJECTS */}
          <TabsContent value="projects">
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <FolderGit2 className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-base font-medium text-gray-600 mb-1">No projects yet</p>
                  <p className="text-sm mb-6">Launch your first open source project</p>
                  <Link href="/dashboard/new">
                    <Button variant="default">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                projects.map((project) => (
                  <Card key={project.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <Link
                            href={`/project/${project.slug}`}
                            className="text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {project.name}
                          </Link>
                          <Badge
                            variant={project.status === "ACTIVE" ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {project.status}
                          </Badge>
                          {project.language && (
                            <Badge variant="secondary" className="text-xs">{project.language}</Badge>
                          )}
                        </div>
                        {project.description && (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        {project.fundingGoal && project.fundingGoal > 0 ? (
                          <div>
                            <Progress
                              value={project.totalRaised}
                              max={project.fundingGoal}
                              className="h-1.5"
                            />
                            <div className="flex justify-between mt-1.5">
                              <span className="text-xs text-gray-500">
                                <strong className="text-gray-900">${project.totalRaised.toFixed(2)}</strong> raised
                              </span>
                              <span className="text-xs text-gray-400">
                                Goal: ${project.fundingGoal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 font-semibold">
                            ${project.totalRaised.toFixed(2)} raised
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {project.supporterCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {project.healthScore}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {project.stars}
                          </span>
                        </div>
                        <Link href={`/project/${project.slug}`}>
                          <Button variant="secondary" size="sm" className="h-8">
                            View <ChevronRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* ANALYTICS */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="p-6">
                <CardHeader className="p-0 pb-6">
                  <CardTitle className="text-base">Funding Trend</CardTitle>
                  <p className="text-sm text-gray-400 mt-0.5">Monthly revenue (USDC)</p>
                </CardHeader>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", color: "#111827" }}
                      formatter={(v: unknown) => [`$${(v as number).toFixed(2)}`, "Raised"]}
                    />
                    <Area type="monotone" dataKey="raised" stroke="#2563eb" strokeWidth={2} fill="url(#analyticsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 h-full">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base">Project Performance</CardTitle>
                </CardHeader>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-900 truncate max-w-[200px]">{project.name}</span>
                        <span className="text-gray-700 font-medium font-mono">
                          ${project.totalRaised.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={project.analytics?.pageViews ?? 0}
                          max={Math.max(...projects.map((p) => p.analytics?.pageViews ?? 0), 1)}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-400 w-16 text-right">
                          {project.analytics?.pageViews ?? 0} views
                        </span>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">No analytics yet</p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TREASURY */}
          <TabsContent value="treasury">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {[
                { label: "Total Raised", value: formatAmount(stats.totalRaised), icon: TrendingUp },
                { label: "This Month", value: formatAmount(projects.reduce((s, p) => s + p.monthlyRaised, 0)), icon: Zap },
                { label: "Avg per Project", value: projects.length > 0 ? formatAmount(stats.totalRaised / projects.length) : "$0", icon: Activity },
              ].map((item) => (
                <Card key={item.label} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <item.icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                </Card>
              ))}
            </div>

            <Card className="p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base">Project Treasuries</CardTitle>
                <p className="text-sm text-gray-400 mt-0.5">Stellar wallet balances per project</p>
              </CardHeader>
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {project._count.donations} donation{project._count.donations !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 font-semibold font-mono text-sm">
                        ${project.totalRaised.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400">USDC</p>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-gray-400 text-sm text-center py-8">No projects yet</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
