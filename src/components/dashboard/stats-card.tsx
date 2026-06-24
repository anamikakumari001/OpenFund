"use client";

import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number;
  change: number;
  icon: LucideIcon;
  color?: "sky" | "violet" | "green" | "amber";
  prefix?: string;
  suffix?: string;
  decimals?: number;
  formatValue?: (v: number) => string;
}

function useCountUp(target: number, duration = 1400, decimals = 0): number {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCount(0);
    startTimeRef.current = null;

    const step = (timestamp: number) => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = parseFloat((eased * target).toFixed(decimals));
      setCount(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, decimals]);

  return count;
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color = "sky",
  prefix = "",
  suffix = "",
  decimals = 0,
  formatValue,
}: StatsCardProps) {
  const animated = useCountUp(value, 1400, decimals);

  const displayValue = formatValue
    ? formatValue(animated)
    : `${prefix}${animated.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

  const isPositive = change > 0;
  const isNeutral = change === 0;
  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  const trendClass = isNeutral
    ? "bg-gray-100 text-gray-500 border-gray-200"
    : isPositive
    ? "bg-green-50 text-green-700 border-green-200"
    : "bg-red-50 text-red-600 border-red-200";

  const iconBgClass = {
    sky:    "bg-blue-50 border-blue-200 text-blue-600",
    violet: "bg-purple-50 border-purple-200 text-purple-600",
    green:  "bg-green-50 border-green-200 text-green-600",
    amber:  "bg-amber-50 border-amber-200 text-amber-600",
  }[color];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", iconBgClass)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", trendClass)}>
          <TrendIcon className="h-3 w-3" />
          <span>{isNeutral ? "0%" : `${isPositive ? "+" : ""}${change.toFixed(1)}%`}</span>
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight text-gray-900 tabular-nums">{displayValue}</p>
      <p className="mt-0.5 text-sm text-gray-500">{title}</p>
    </div>
  );
}
