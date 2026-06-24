"use client";

import React, { useState } from "react";
import { Users, TrendingUp, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import type { ProjectWithDetails } from "@/types";
import { DonationModal } from "@/components/donation/donation-modal";

interface FundingPanelProps {
  project: ProjectWithDetails;
}

export function FundingPanel({ project }: FundingPanelProps) {
  const [donateOpen, setDonateOpen] = useState(false);
  const raised = Number(project.totalRaised);
  const goal = Number(project.fundingGoal ?? 0);
  const progress = goal > 0 ? formatPercent(raised, goal) : 0;

  return (
    <>
      <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {/* Accent bar */}
        <div className="h-1 w-full bg-gray-900" />

        <div className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Project Funding</h3>

          {/* Progress */}
          {goal > 0 && (
            <div className="mb-5">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{progress}%</span>
                  <span className="text-sm text-gray-400 ml-1.5">funded</span>
                </div>
              </div>
              <Progress value={progress} className="h-2 mb-3" />
            </div>
          )}

          {/* Stats */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Raised</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(raised)}
              </span>
            </div>
            {goal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Goal</span>
                <span className="text-sm text-gray-700">{formatCurrency(goal)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Supporters</span>
              <span className="text-sm text-gray-700">
                {formatNumber(project.supporterCount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">This month</span>
              <span className="text-sm font-medium text-green-600">
                +{formatCurrency(Number(project.monthlyRaised))}
              </span>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => setDonateOpen(true)}
            variant="default"
            className="w-full gap-2"
          >
            <Heart className="h-4 w-4" />
            Support This Project
          </Button>

          {project.treasuryAddress && (
            <a
              href={`https://stellar.expert/explorer/testnet/account/${project.treasuryAddress}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 mt-3 text-xs text-gray-400 hover:text-gray-700 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View on Stellar
            </a>
          )}
        </div>

        {/* Stats footer */}
        <div className="grid grid-cols-2 border-t border-gray-100">
          <div className="flex flex-col items-center p-4 border-r border-gray-100">
            <Users className="h-4 w-4 text-gray-400 mb-1" />
            <span className="text-sm font-semibold text-gray-900">
              {formatNumber(project._count.donations)}
            </span>
            <span className="text-xs text-gray-400">Donations</span>
          </div>
          <div className="flex flex-col items-center p-4">
            <TrendingUp className="h-4 w-4 text-gray-400 mb-1" />
            <span className="text-sm font-semibold text-gray-900">
              {project.healthScore}
            </span>
            <span className="text-xs text-gray-400">Health Score</span>
          </div>
        </div>
      </div>

      <DonationModal
        project={project}
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
      />
    </>
  );
}
