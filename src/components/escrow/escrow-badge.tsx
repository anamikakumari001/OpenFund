"use client";

import { Lock, Unlock, XCircle, CheckCircle2 } from "lucide-react";

interface EscrowBadgeProps {
  released: boolean;
  cancelled: boolean;
  balance: number;
  className?: string;
}

export function EscrowBadge({ released, cancelled, balance, className = "" }: EscrowBadgeProps) {
  if (released) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 ${className}`}>
        <CheckCircle2 className="w-3 h-3" />
        Released
      </span>
    );
  }
  if (cancelled) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200 ${className}`}>
        <XCircle className="w-3 h-3" />
        Cancelled
      </span>
    );
  }
  if (balance > 0) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ${className}`}>
        <Lock className="w-3 h-3" />
        {balance.toFixed(0)} USDC in escrow
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 ${className}`}>
      <Unlock className="w-3 h-3" />
      Escrow ready
    </span>
  );
}
