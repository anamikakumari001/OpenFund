"use client";

import React from "react";
import Link from "next/link";
import { Star, GitFork, ArrowRight, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatCurrency, formatPercent } from "@/lib/utils";
import type { ProjectCardData } from "@/types";

interface ProjectCardProps {
  project: ProjectCardData;
}

function ProjectCard({ project }: ProjectCardProps) {
  const progress = formatPercent(
    Number(project.totalRaised),
    Number(project.fundingGoal ?? 1)
  );

  const healthColor =
    project.healthScore >= 80
      ? "bg-green-500"
      : project.healthScore >= 60
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <Link href={`/project/${project.slug}`}>
      <div className="group h-full rounded-2xl border border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:shadow-gray-100 transition-all duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              {project.logoUrl ? (
                <img
                  src={project.logoUrl}
                  alt={project.name}
                  className="h-9 w-9 rounded-xl object-cover border border-gray-200"
                />
              ) : (
                <div className="h-9 w-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-gray-500" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {project.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {project.owner.name ?? project.owner.githubUsername}
                </p>
              </div>
            </div>

            {/* Health indicator */}
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${healthColor}`} />
              <span className="text-xs text-gray-400">{project.healthScore}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {project.description ?? "No description available."}
          </p>
        </div>

        {/* Stats */}
        <div className="px-5 pb-4 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            {formatNumber(project.stars)}
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="h-3.5 w-3.5" />
            {formatNumber(project.forks)}
          </span>
          {project.language && (
            <Badge variant="secondary" className="text-[10px] h-5 rounded-md">
              {project.language}
            </Badge>
          )}
        </div>

        {/* Funding */}
        {project.fundingGoal && (
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-500">
                {formatCurrency(project.totalRaised)} raised
              </span>
              <span className="text-xs font-medium text-gray-700">{progress}%</span>
            </div>
            <Progress value={progress} />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-gray-400">
                Goal: {formatCurrency(project.fundingGoal)}
              </span>
              <span className="text-xs text-gray-400">
                {project.supporterCount} supporters
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

interface TrendingProjectsProps {
  projects: ProjectCardData[];
}

export function TrendingProjects({ projects }: TrendingProjectsProps) {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-2">Trending this week</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Active projects
            </h2>
            <p className="text-gray-500 mt-2">
              Discover the most funded and active open source projects
            </p>
          </div>
          <Link
            href="/explore"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-56 rounded-2xl border border-gray-200 skeleton"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
