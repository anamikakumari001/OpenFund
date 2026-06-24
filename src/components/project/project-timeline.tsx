"use client";

import { GitCommit, Star, Tag } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import type { ReleaseData as Release } from "@/types";

interface TimelineEvent {
  id: string;
  type: "release" | "milestone" | "stars" | "created";
  title: string;
  description?: string;
  date: Date | string;
  icon: typeof GitCommit;
  colorClass: string;
}

interface ProjectTimelineProps {
  releases: Release[];
  createdAt: Date;
  stars: number;
}

export function ProjectTimeline({ releases, createdAt, stars }: ProjectTimelineProps) {
  const events: TimelineEvent[] = [
    {
      id: "created",
      type: "created",
      title: "Repository Created",
      description: "Project started its open source journey",
      date: createdAt,
      icon: GitCommit,
      colorClass: "bg-blue-50 border-blue-200 text-blue-600",
    },
    ...releases.map((r) => ({
      id: r.id,
      type: "release" as const,
      title: `Released ${r.tagName}`,
      description: r.name ?? undefined,
      date: r.publishedAt ?? r.createdAt,
      icon: Tag,
      colorClass: "bg-purple-50 border-purple-200 text-purple-600",
    })),
  ];

  if (stars >= 100) {
    events.push({
      id: "stars-100",
      type: "stars",
      title: "100 Stars Milestone",
      description: "Community recognized the project",
      date: createdAt,
      icon: Star,
      colorClass: "bg-amber-50 border-amber-200 text-amber-600",
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative space-y-4">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

      {events.map((event) => (
        <div key={event.id} className="flex items-start gap-4 pl-12 relative">
          <div className={`absolute left-0 h-8 w-8 rounded-xl border flex items-center justify-center ${event.colorClass}`}>
            <event.icon className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">{event.title}</p>
              <span className="text-xs text-gray-400 shrink-0">{timeAgo(event.date)}</span>
            </div>
            {event.description && (
              <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
