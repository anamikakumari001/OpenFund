"use client";

import { getHealthLabel } from "@/lib/utils";

interface HealthCoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function HealthCore({ score, size = "md" }: HealthCoreProps) {
  const label = getHealthLabel(score);
  const color =
    score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#dc2626";

  const dims = size === "sm" ? 48 : size === "lg" ? 96 : 64;
  const strokeWidth = size === "sm" ? 3 : 4;
  const r = (dims - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg width={dims} height={dims} className="-rotate-90">
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={circ - dash}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold"
            style={{
              color,
              fontSize: size === "sm" ? 12 : size === "lg" ? 22 : 15,
            }}
          >
            {score}
          </span>
          {size !== "sm" && (
            <span className="text-[9px] text-gray-400">/100</span>
          )}
        </div>
      </div>

      {size !== "sm" && (
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}
