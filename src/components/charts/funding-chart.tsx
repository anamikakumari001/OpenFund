"use client";

import React, { useId } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  amount: number;
}

interface FundingChartProps {
  data: DataPoint[];
  currency?: string;
}

function CustomTooltip(props: Record<string, unknown> & { currency?: string }) {
  const { active, payload, label, currency } = props as {
    active?: boolean;
    payload?: Array<{ value?: number }>;
    label?: string;
    currency?: string;
  };
  if (!active || !payload || !payload.length) return null;
  const value = payload[0]?.value as number;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-md">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-gray-900">
        {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
        {currency}
      </p>
    </div>
  );
}

export function FundingChart({ data, currency = "USDC" }: FundingChartProps) {
  const uid = useId();
  const gradientId = `fundingGradient-${uid.replace(/:/g, "")}`;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} dy={6} />
        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)} />
        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#2563EB"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: "#2563EB", stroke: "#BFDBFE", strokeWidth: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
