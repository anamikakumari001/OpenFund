"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Lock, Unlock, CheckCircle2, XCircle, AlertTriangle,
  Loader2, ExternalLink, ChevronDown, ChevronUp, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EscrowBadge } from "./escrow-badge";
import { CONTRACT_ID } from "@/lib/contract";
import type { Milestone } from "@prisma/client";

interface EscrowState {
  dbBalance: number;
  released: boolean;
  cancelled: boolean;
  isOwner: boolean;
  donorAmount: number;
  onChain: { balance: number; released: boolean; cancelled: boolean } | null;
}

interface MilestoneEscrowPanelProps {
  milestone: Milestone & { project: { ownerId: string; treasuryAddress: string | null } };
  onUpdate?: () => void;
}

export function MilestoneEscrowPanel({ milestone, onUpdate }: MilestoneEscrowPanelProps) {
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [escrow, setEscrow] = useState<EscrowState | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("10");

  const fetchEscrow = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/escrow/${milestone.id}`);
      const data = await res.json() as EscrowState;
      setEscrow(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [milestone.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (expanded) void fetchEscrow();
  }, [expanded, fetchEscrow]);

  const act = async (action: "fund" | "release" | "cancel" | "refund") => {
    setActionLoading(action);
    setError(null);
    setTxHash(null);

    try {
      let res: Response;
      if (action === "fund") {
        res = await fetch("/api/escrow/fund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneId: milestone.id, amount: fundAmount }),
        });
      } else {
        res = await fetch(`/api/escrow/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneId: milestone.id }),
        });
      }

      const data = await res.json() as { txHash?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? `${action} failed`);

      setTxHash(data.txHash ?? null);
      await fetchEscrow();
      onUpdate?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const isOwner = escrow?.isOwner ?? milestone.project.ownerId === session?.user?.id;
  const balance = escrow?.dbBalance ?? Number(milestone.escrowBalance);
  const released = escrow?.released ?? milestone.escrowReleased;
  const cancelled = escrow?.cancelled ?? milestone.escrowCancelled;
  const donorAmount = escrow?.donorAmount ?? 0;
  const hasEscrow = balance > 0 || released || cancelled;

  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Milestone Escrow</span>
          <EscrowBadge released={released} cancelled={cancelled} balance={balance} />
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-400 leading-relaxed">
                Funds are locked in a Soroban smart contract on Stellar. The project owner releases
                them when the milestone is completed, or cancels to allow refunds.
              </p>

              {hasEscrow && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] text-gray-400">Locked</p>
                    <p className="text-sm font-bold text-gray-900 font-mono">{balance.toFixed(2)} USDC</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] text-gray-400">Status</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {released ? "Released ✓" : cancelled ? "Cancelled" : "Active"}
                    </p>
                  </div>
                </div>
              )}

              {donorAmount > 0 && !released && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700">
                    You have <strong>{donorAmount.toFixed(2)} USDC</strong> escrowed
                    {cancelled && " — eligible for refund"}
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {txHash && (
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Transaction confirmed
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {!released && !cancelled && (
                <div className="space-y-2">
                  {session && !isOwner && (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type="number"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          className="pr-14 h-8 text-sm"
                          min="1"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">USDC</span>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 h-8 text-xs shrink-0"
                        onClick={() => void act("fund")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === "fund" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                        Escrow Funds
                      </Button>
                    </div>
                  )}

                  {isOwner && balance > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 h-8 text-xs bg-green-600 hover:bg-green-700 text-white flex-1"
                        onClick={() => void act("release")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === "release" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5" />
                        )}
                        Release to Treasury
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs border-red-200 text-red-600 hover:bg-red-50 flex-1"
                        onClick={() => void act("cancel")}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === "cancel" ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        Cancel Escrow
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {cancelled && donorAmount > 0 && (
                <Button
                  size="sm"
                  className="w-full gap-1.5 h-8 text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                  onClick={() => void act("refund")}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === "refund" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  Claim Refund ({donorAmount.toFixed(2)} USDC)
                </Button>
              )}

              <a
                href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View contract on Stellar Explorer
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
