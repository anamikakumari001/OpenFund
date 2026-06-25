"use client";

import React, { useEffect, useState } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";

export interface HealthMetrics {
  commitsScore: number;
  releasesScore: number;
  issuesScore: number;
  communityScore: number;
  fundingScore: number;
}

interface HealthChartProps {
  metrics: HealthMetrics;
}

function CustomTooltip(props: Record<string, unknown>) {
  const { active, payload } = props as {
    active?: boolean;
    payload?: Array<{ value?: number; payload?: { subject?: string } }>;
  };
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-md">
      <p className="text-xs text-gray-400">{item.payload?.subject}</p>
      <p className="text-sm font-semibold text-gray-900">
        {(item.value as number).toFixed(0)}
        <span className="text-xs text-gray-400 ml-0.5">/ 100</span>
      </p>
    </div>
  );
}

export function HealthChart({ metrics }: HealthChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const data = [
    { subject: "Commits",   value: animated ? metrics.commitsScore   : 0, fullMark: 100 },
    { subject: "Releases",  value: animated ? metrics.releasesScore  : 0, fullMark: 100 },
    { subject: "Issues",    value: animated ? metrics.issuesScore    : 0, fullMark: 100 },
    { subject: "Community", value: animated ? metrics.communityScore : 0, fullMark: 100 },
    { subject: "Funding",   value: animated ? metrics.fundingScore   : 0, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#E5E7EB" gridType="polygon" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#6B7280", fontSize: 11 }} tickLine={false} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} tickLine={false} tickCount={4} />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="Health"
          dataKey="value"
          stroke="#2563EB"
          strokeWidth={1.5}
          fill="#2563EB"
          fillOpacity={0.08}
          dot={{ r: 3, fill: "#2563EB", strokeWidth: 0 }}
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
          isAnimationActive={animated}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
