"use client";

import React from "react";
import { Calendar, Target, Zap, Circle, Clock, CheckCircle2 } from "lucide-react";
import type { MilestoneData as Milestone } from "@/types";
import { cn, formatCurrency, formatPercent, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface MilestoneCardProps {
  milestone: Milestone;
  projectId: string;
  onDonate?: (milestoneId: string) => void;
}

type MilestoneStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

const statusConfig: Record<MilestoneStatus, { label: string; icon: React.ComponentType<{ className?: string }>; iconClass: string; badgeClass: string }> = {
  OPEN:        { label: "Open",        icon: Circle,       iconClass: "text-gray-400", badgeClass: "bg-gray-100 text-gray-600 border-gray-200" },
  IN_PROGRESS: { label: "In Progress", icon: Clock,        iconClass: "text-blue-600", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, iconClass: "text-green-600",badgeClass: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED:   { label: "Cancelled",   icon: Circle,       iconClass: "text-gray-300", badgeClass: "bg-gray-100 text-gray-400 border-gray-200" },
};

export function MilestoneCard({ milestone, onDonate }: MilestoneCardProps) {
  const status = (milestone.status as MilestoneStatus) ?? "OPEN";
  const theme = statusConfig[status];
  const StatusIcon = theme.icon;

  const raised = Number(milestone.totalRaised ?? 0);
  const goal = Number(milestone.fundingGoal ?? 0);
  const progress = goal > 0 ? formatPercent(raised, goal) : milestone.progress ?? 0;

  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED";
  const canDonate = !isCompleted && !isCancelled && !!onDonate;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-colors p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon className={cn("h-4 w-4 flex-shrink-0", theme.iconClass)} />
          <h3 className="text-sm font-semibold text-gray-900 truncate">{milestone.title}</h3>
        </div>
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium flex-shrink-0", theme.badgeClass)}>
          {theme.label}
        </span>
      </div>

      {milestone.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed ml-6">
          {milestone.description}
        </p>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Funding progress</span>
          <span className="font-medium text-gray-900">{progress}%</span>
        </div>
        <Progress value={progress} />
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">{formatCurrency(raised)} raised</span>
          {goal > 0 && <span className="text-gray-400">of {formatCurrency(goal)} goal</span>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {milestone.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {timeAgo(milestone.dueDate)}
            </span>
          )}
          {milestone.issueCount > 0 && (
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {milestone.closedCount}/{milestone.issueCount} issues
            </span>
          )}
        </div>
        {canDonate && (
          <Button size="sm" variant="secondary" onClick={() => onDonate(milestone.id)} className="gap-1.5 text-xs h-7 px-3">
            <Zap className="h-3 w-3" />
            Fund
          </Button>
        )}
      </div>
    </div>
  );
}
