"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Star, GitFork, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import type { ProjectWithOwner } from "@/types";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "DEVELOPER_TOOLS", label: "Dev Tools" },
  { value: "FRAMEWORKS", label: "Frameworks" },
  { value: "LIBRARIES", label: "Libraries" },
  { value: "INFRASTRUCTURE", label: "Infrastructure" },
  { value: "SECURITY", label: "Security" },
  { value: "ML_AI", label: "ML / AI" },
  { value: "BLOCKCHAIN", label: "Blockchain" },
  { value: "DATA", label: "Data" },
  { value: "WEB", label: "Web" },
  { value: "MOBILE", label: "Mobile" },
  { value: "OTHER", label: "Other" },
];

const SORTS = [
  { value: "trending", label: "Trending" },
  { value: "funded", label: "Most Funded" },
  { value: "stars", label: "Most Stars" },
  { value: "newest", label: "Newest" },
  { value: "health", label: "Health Score" },
];

function ProjectCard({ project, index }: { project: ProjectWithOwner; index: number }) {
  const raised = Number(project.totalRaised);
  const goal = Number(project.fundingGoal ?? 0);
  const progress = goal > 0 ? formatPercent(raised, goal) : 0;

  const healthColor =
    project.healthScore >= 80
      ? "bg-green-500"
      : project.healthScore >= 60
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <Link href={`/project/${project.slug}`}>
      <div className="group h-full rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:shadow-gray-100 transition-all duration-200 overflow-hidden">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {project.logoUrl ? (
                <img
                  src={project.logoUrl}
                  alt={project.name}
                  className="h-9 w-9 rounded-xl object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-gray-500" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {project.owner.githubUsername ?? project.owner.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${healthColor}`} />
              <span className="text-xs text-gray-400">{project.healthScore}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
            {project.description ?? "No description"}
          </p>

          {/* Topics */}
          {project.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.topics.slice(0, 3).map((topic) => (
                <Badge key={topic} variant="secondary" className="text-[10px] h-4 px-1.5 rounded">
                  {topic}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" />
              {formatNumber(project.stars)}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="h-3.5 w-3.5" />
              {formatNumber(project.forks)}
            </span>
            {project.language && (
              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px]">
                {project.language}
              </span>
            )}
          </div>

          {/* Funding */}
          {goal > 0 && (
            <>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">{formatCurrency(raised)} raised</span>
                <span className="font-medium text-gray-700">{progress}%</span>
              </div>
              <Progress value={progress} />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>Goal: {formatCurrency(goal)}</span>
                <span>{project.supporterCount} supporters</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ExplorePage() {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trending");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projects-explore", category, sort, q, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
        sort,
        ...(category !== "all" && { category }),
        ...(q && { q }),
      });
      const res = await fetch(`/api/projects?${params}`);
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<{ projects: ProjectWithOwner[]; total: number; totalPages: number }>;
    },
    staleTime: 30000,
  });

  const handleSearch = useCallback(() => {
    setQ(searchInput);
    setPage(1);
  }, [searchInput]);

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Projects</h1>
            <p className="text-gray-500">
              Discover open source projects. Fund the ones you care about.
            </p>
          </div>

          {/* Search */}
          <div className="flex gap-2 max-w-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search projects, languages, topics..."
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="default">
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="flex flex-wrap gap-1.5 flex-1">
            {CATEGORIES.slice(0, 8).map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  category === cat.value
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <Select value={sort} onValueChange={(v) => { setSort(v); setPage(1); }}>
              <SelectTrigger className="w-36 h-9 text-xs border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results info */}
        {data && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {data.total.toLocaleString()} projects
              {q && <span className="text-gray-900 ml-1">for &quot;{q}&quot;</span>}
            </p>
            {q && (
              <button
                onClick={() => { setQ(""); setSearchInput(""); setPage(1); }}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl border border-gray-100 skeleton" />
            ))}
          </div>
        ) : data?.projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-700 mb-1">No projects found</p>
            <p className="text-sm text-gray-400">Try different filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.projects.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-8 w-8 rounded-lg text-sm transition-all ${
                    page === p
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
