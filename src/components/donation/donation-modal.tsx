"use client";

import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  Heart,
  AlertCircle,
  Loader2,
  Lock,
  Shield,
  ExternalLink,
} from "lucide-react";
import type { ProjectWithDetails } from "@/types";

type Step = "amount" | "confirm" | "success";
type Currency = "USDC" | "XLM";
type Mode = "direct" | "escrow";

const PRESET_AMOUNTS = ["10", "25", "50", "100", "250"];

interface DonationModalProps {
  project: ProjectWithDetails;
  open: boolean;
  onClose: () => void;
  milestoneId?: string;
  issueId?: string;
}

export function DonationModal({
  project,
  open,
  onClose,
  milestoneId,
  issueId,
}: DonationModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("25");
  const [currency, setCurrency] = useState<Currency>("XLM");
  const [mode, setMode] = useState<Mode>("direct");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const canEscrow = !!milestoneId;

  const reset = () => {
    setStep("amount");
    setAmount("25");
    setCurrency("XLM");
    setMode("direct");
    setMessage("");
    setAnonymous(false);
    setLoading(false);
    setError(null);
    setTxHash(null);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleDonate = async () => {
    if (!session) { signIn("github"); return; }
    setLoading(true);
    setError(null);
    try {
      if (mode === "escrow" && milestoneId) {
        const res = await fetch("/api/escrow/fund", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ milestoneId, amount, message: message || undefined, anonymous }),
        });
        const data = await res.json() as { txHash?: string; donationId?: string; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Escrow failed");
        setTxHash(data.txHash ?? null);
        setStep("success");
        return;
      }

      const res = await fetch("/api/stellar/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          amount,
          currency,
          message: message || undefined,
          anonymous,
          milestoneId,
          issueId,
        }),
      });
      const data = await res.json() as { txHash?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Donation failed");
      setTxHash(data.txHash ?? null);
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Donation failed");
    } finally {
      setLoading(false);
    }
  };

  const walletAddress = session?.user?.stellarPublicKey;
  const shortWallet = walletAddress
    ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
    : null;
  const isEscrow = mode === "escrow";

  const stepTitles: Record<Step, string> = {
    amount: `Support ${project.name}`,
    confirm: isEscrow ? "Confirm Escrow" : "Confirm Donation",
    success: isEscrow ? "Funds Locked in Escrow" : "Donation Confirmed",
  };
  const stepDescs: Record<Step, string> = {
    amount: "Choose an amount to support this project",
    confirm: isEscrow
      ? "Funds will be locked in a smart contract until the milestone is completed"
      : "Review your donation before sending",
    success: isEscrow
      ? "Funds are locked on-chain — released when milestone is completed"
      : "Your donation is on-chain and permanent",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{stepTitles[step]}</DialogTitle>
          <DialogDescription>{stepDescs[step]}</DialogDescription>
        </DialogHeader>

        {/* STEP 1: Amount */}
        {step === "amount" && (
          <div className="space-y-4">
            {canEscrow && (
              <div className="flex gap-2">
                {(["direct", "escrow"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      if (m === "escrow") setCurrency("USDC");
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      mode === m
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {m === "escrow" ? <Lock className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
                    {m === "direct" ? "Direct" : "Escrow"}
                  </button>
                ))}
              </div>
            )}

            {isEscrow && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  <strong>Escrow:</strong> Funds are locked in a Soroban smart contract. Released to the project only when the milestone is completed — otherwise fully refundable.
                </p>
              </div>
            )}

            {!isEscrow && (
              <div className="flex gap-2">
                {(["XLM", "USDC"] as Currency[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      currency === c
                        ? "bg-gray-900 text-white"
                        : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-2 rounded-xl text-sm font-medium transition-all ${
                    amount === preset
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom amount"
                className="pr-16"
                min="1"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {currency}
              </span>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave a message (optional)"
              className="h-20"
            />

            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setAnonymous(!anonymous)}
                className={`h-5 w-9 rounded-full transition-all ${
                  anonymous ? "bg-gray-900" : "bg-gray-200"
                }`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${
                    anonymous ? "translate-x-4 ml-1" : "translate-x-0.5"
                  }`}
                />
              </div>
              <span className="text-sm text-gray-600">Donate anonymously</span>
            </label>

            {!session ? (
              <Button
                onClick={() => signIn("github")}
                variant="default"
                className="w-full gap-2"
              >
                <GitBranch className="h-4 w-4" />
                Sign in to Donate
              </Button>
            ) : (
              <Button
                onClick={() => setStep("confirm")}
                variant="default"
                className="w-full gap-2"
                disabled={!amount || parseFloat(amount) <= 0}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* STEP 2: Confirm */}
        {step === "confirm" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-gray-900 text-base">
                  {amount} {currency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">To</span>
                <span className="text-gray-900 font-medium">{project.name}</span>
              </div>
              {message && (
                <div className="flex justify-between text-sm gap-4">
                  <span className="text-gray-500 shrink-0">Message</span>
                  <span className="text-gray-700 text-right text-xs">{message}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Anonymous</span>
                <span className="text-gray-700">{anonymous ? "Yes" : "No"}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Sending from your wallet</span>
              </div>
              {shortWallet ? (
                <p className="text-xs font-mono text-gray-500">{shortWallet}</p>
              ) : (
                <p className="text-xs text-amber-600">
                  Wallet not yet created — please sign out and sign back in.
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleDonate}
              disabled={loading || !walletAddress}
              variant="default"
              className="w-full gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending on Stellar...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4" />
                  Confirm & Send {amount} {currency}
                </>
              )}
            </Button>

            <button
              onClick={() => { setError(null); setStep("amount"); }}
              className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {/* STEP 3: Success */}
        {step === "success" && (
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
                isEscrow ? "bg-blue-600" : "bg-green-600"
              }`}>
                {isEscrow ? <Lock className="h-8 w-8 text-white" /> : <CheckCircle2 className="h-8 w-8 text-white" />}
              </div>
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900 mb-1">
                {amount} {currency} sent!
              </p>
              <p className="text-sm text-gray-500">
                You&apos;re now supporting {project.name}
              </p>
            </div>

            {txHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Stellar Explorer
              </a>
            )}

            <Button onClick={handleClose} variant="default" className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
