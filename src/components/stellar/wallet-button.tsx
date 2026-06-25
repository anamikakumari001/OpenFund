"use client";

import { Wallet, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStellarStore } from "@/stores/stellar";

export function WalletButton() {
  const { publicKey, status, connect, disconnect } = useStellarStore();

  if (publicKey) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm hover:bg-green-500/20 transition-all"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span className="font-mono text-xs">
          {publicKey.slice(0, 6)}...{publicKey.slice(-4)}
        </span>
      </button>
    );
  }

  return (
    <Button
      variant="glass"
      size="sm"
      onClick={connect}
      disabled={status === "connecting"}
      className="gap-2"
    >
      {status === "connecting" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      {status === "connecting" ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
