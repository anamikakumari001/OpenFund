"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Copy, Check, ExternalLink, ChevronRight, Zap, ArrowDownToLine, Info } from "lucide-react";

interface FundWalletModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  isTestnet?: boolean;
}

const STEPS = [
  { n: "1", title: "Copy your wallet address", body: "Use the button below to copy your full Stellar public key." },
  { n: "2", title: "Get funds", body: "On testnet: use Friendbot to get 10,000 free XLM, or swap XLM → USDC on the testnet DEX. On mainnet: transfer from any exchange (Coinbase, Kraken, etc.)." },
  { n: "3", title: "Donate to projects", body: "Once your wallet has XLM or USDC, go to any project and click 'Support This Project'. Direct send or lock in escrow." },
];

export function FundWalletModal({ open, onClose, address, isTestnet = true }: FundWalletModalProps) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const friendbotUrl = `https://laboratory.stellar.org/#account-creator?network=test`;
  const explorerUrl = isTestnet
    ? `https://stellar.expert/explorer/testnet/account/${address}`
    : `https://stellar.expert/explorer/public/account/${address}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-gray-600" />
            Fund Your Wallet
          </DialogTitle>
          <DialogDescription>
            Add XLM or USDC to your Stellar wallet to start donating
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Address */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-semibold text-gray-600 tracking-wide uppercase">Your Receive Address</span>
              {isTestnet && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                  Testnet
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <code className="flex-1 text-xs text-gray-600 font-mono break-all leading-relaxed select-all">
                  {address}
                </code>
                <button
                  onClick={copy}
                  className="shrink-0 p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 mt-2 pl-1">Address copied to clipboard</p>
              )}
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">How to add funds</p>
            {STEPS.map((step) => (
              <div key={step.n} className="flex gap-3 p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-gray-600">{step.n}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            {isTestnet && (
              <a
                href={friendbotUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Friendbot</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            )}
            <a
              href={explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all group"
            >
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">Explorer</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {isTestnet && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                You are on <strong>Stellar Testnet</strong>. Funds have no real value. Use Friendbot to get free testnet XLM, then swap for USDC on testnet DEX.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
