"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Clock, Target, DollarSign } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { MilestoneData as Milestone } from "@/types";
import { DonationModal } from "@/components/donation/donation-modal";
import { MilestoneEscrowPanel } from "@/components/escrow/milestone-escrow-panel";
import type { ProjectWithDetails } from "@/types";

type MilestoneEscrowPanelMilestone = React.ComponentProps<typeof MilestoneEscrowPanel>["milestone"];

interface RoadmapViewProps {
  milestones: Milestone[];
  project: ProjectWithDetails;
}

const STATUS_CONFIG = {
  OPEN: { icon: Circle, label: "Planned", variant: "secondary" as const },
  IN_PROGRESS: { icon: Clock, label: "In Progress", variant: "default" as const },
  COMPLETED: { icon: CheckCircle2, label: "Completed", variant: "success" as const },
  CANCELLED: { icon: Circle, label: "Cancelled", variant: "danger" as const },
};

const STATUS_ICON_COLOR: Record<string, string> = {
  COMPLETED: "text-green-600",
  IN_PROGRESS: "text-blue-600",
  OPEN: "text-gray-400",
  CANCELLED: "text-gray-300",
};

export function RoadmapView({ milestones, project }: RoadmapViewProps) {
  const [donateOpen, setDonateOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  if (milestones.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <Target className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm">No milestones yet. Maintainer will add them soon.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const config = STATUS_CONFIG[milestone.status] ?? STATUS_CONFIG.OPEN;
          const iconColor = STATUS_ICON_COLOR[milestone.status] ?? "text-gray-400";
          const fundingProgress = formatPercent(
            Number(milestone.totalRaised),
            Number(milestone.fundingGoal ?? 1)
          );
          const issueProgress = milestone.issueCount > 0
            ? Math.round((milestone.closedCount / milestone.issueCount) * 100)
            : 0;

          return (
            <div
              key={milestone.id}
              className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-gray-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <config.icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                  <h4 className="text-sm font-semibold text-gray-900">{milestone.title}</h4>
                </div>
                <Badge variant={config.variant}>{config.label}</Badge>
              </div>

              {milestone.description && (
                <p className="text-xs text-gray-500 mb-4 ml-6.5 pl-0.5">{milestone.description}</p>
              )}

              <div className="ml-6 space-y-3">
                {milestone.issueCount > 0 && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                      <span>Issues: {milestone.closedCount}/{milestone.issueCount}</span>
                      <span>{issueProgress}%</span>
                    </div>
                    <Progress value={issueProgress} className="h-1.5" />
                  </div>
                )}

                {milestone.fundingGoal && (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-500">
                        {formatCurrency(Number(milestone.totalRaised))} raised
                      </span>
                      <span className="font-medium text-gray-700">{fundingProgress}%</span>
                    </div>
                    <Progress value={fundingProgress} className="h-1.5" />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        Goal: {formatCurrency(Number(milestone.fundingGoal))}
                      </span>
                      {milestone.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            setSelectedMilestone(milestone);
                            setDonateOpen(true);
                          }}
                        >
                          <DollarSign className="h-3 w-3" />
                          Fund
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <MilestoneEscrowPanel
                  milestone={milestone as unknown as MilestoneEscrowPanelMilestone}
                  onUpdate={() => {}}
                />
              </div>
            </div>
          );
        })}
      </div>

      {selectedMilestone && (
        <DonationModal
          project={project}
          open={donateOpen}
          onClose={() => {
            setDonateOpen(false);
            setSelectedMilestone(null);
          }}
          milestoneId={selectedMilestone.id}
        />
      )}
    </>
  );
}
