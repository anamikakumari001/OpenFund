"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, ArrowDownToLine, Wallet, RefreshCw, Coins, TrendingUp } from "lucide-react";
import { FundWalletModal } from "./fund-wallet-modal";

interface Balances {
  xlm: number;
  usdc: number;
}

interface WalletCardProps {
  address: string;
  isOwner?: boolean;
  compact?: boolean;
}

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK !== "mainnet";

function truncate(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
}

export function WalletCard({ address, isOwner = false, compact = false }: WalletCardProps) {
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchBalances = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/stellar/treasury?address=${encodeURIComponent(address)}`);
      if (res.ok) {
        const data = await res.json() as { balance?: { xlm: string; usdc: string } };
        if (data.balance) {
          setBalances({ xlm: parseFloat(data.balance.xlm), usdc: parseFloat(data.balance.usdc) });
        }
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOwner) void fetchBalances();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const copy = () => {
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = isTestnet
    ? `https://stellar.expert/explorer/testnet/account/${address}`
    : `https://stellar.expert/explorer/public/account/${address}`;

  if (compact) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
          <Wallet className="w-4 h-4 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Stellar Wallet</p>
          <code className="text-xs text-gray-700 font-mono">{truncate(address)}</code>
        </div>
        <button onClick={copy} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Copy">
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Stellar Wallet</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] text-gray-400 font-medium">
                  {isTestnet ? "Testnet" : "Mainnet"} · Active
                </p>
              </div>
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => void fetchBalances()}
              className={`p-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all ${loading ? "animate-spin" : ""}`}
              title="Refresh balances"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Address */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 font-medium">
              Public Key (Receive Address)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-600 font-mono break-all leading-relaxed select-all">
                {address}
              </code>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={copy}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-all"
                  title="View on explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </div>
            </div>
            {copied && (
              <p className="text-[10px] text-green-600 mt-1.5">Address copied!</p>
            )}
          </div>

          {/* Balances — owner only */}
          {isOwner && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-4 border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">XLM</span>
                </div>
                {balances ? (
                  <p className="text-lg font-bold text-gray-900 font-mono">
                    {balances.xlm.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                ) : (
                  <div className="h-6 w-20 rounded bg-gray-200 animate-pulse" />
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">Stellar Lumens</p>
              </div>

              <div className="rounded-xl p-4 border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">USDC</span>
                </div>
                {balances ? (
                  <p className="text-lg font-bold text-gray-900 font-mono">
                    {balances.usdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                ) : (
                  <div className="h-6 w-20 rounded bg-gray-200 animate-pulse" />
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">USD Coin</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {isOwner && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-700 text-white transition-colors font-medium text-sm"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Add Funds to Wallet
            </button>
          )}

          {!isOwner && (
            <p className="text-xs text-gray-400 text-center">
              Send XLM or USDC to this address to fund their projects
            </p>
          )}
        </div>
      </div>

      {isOwner && (
        <FundWalletModal
          open={showModal}
          onClose={() => setShowModal(false)}
          address={address}
          isTestnet={isTestnet}
        />
      )}
    </>
  );
}
