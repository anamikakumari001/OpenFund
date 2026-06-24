"use client";

import React, { useEffect, useState } from "react";
import { ExternalLink, ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface TreasuryBalance {
  xlm: string;
  usdc: string;
}

interface TreasuryTx {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  createdAt: string;
}

interface TreasuryPanelProps {
  address: string;
  projectId: string;
}

export function TreasuryPanel({ address, projectId }: TreasuryPanelProps) {
  const [balance, setBalance] = useState<TreasuryBalance | null>(null);
  const [txs, setTxs] = useState<TreasuryTx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/stellar/treasury?address=${address}`);
        if (res.ok) {
          const data = await res.json();
          setBalance(data.balance);
          setTxs(data.transactions ?? []);
        }
      } catch {
        // treasury fetch optional
      } finally {
        setLoading(false);
      }
    }
    if (address) load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    else setLoading(false);
  }, [address]);

  if (!address) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Project Treasury</h3>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {address.slice(0, 8)}...{address.slice(-6)}
            </p>
          </div>
        </div>
        <a
          href={`https://stellar.expert/explorer/testnet/account/${address}`}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {loading ? (
        <div className="p-5 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-gray-100 skeleton" />
          ))}
        </div>
      ) : (
        <>
          {/* Balances */}
          <div className="grid grid-cols-2 p-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-400 mb-1">USDC</div>
              <div className="text-base font-bold text-gray-900">
                {balance ? parseFloat(balance.usdc).toFixed(2) : "—"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-400 mb-1">XLM</div>
              <div className="text-base font-bold text-gray-900">
                {balance ? parseFloat(balance.xlm).toFixed(4) : "—"}
              </div>
            </div>
          </div>

          {txs.length > 0 && (
            <div className="px-4 pb-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Recent Transactions
              </h4>
              <div className="space-y-1.5">
                {txs.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                        tx.to === address
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {tx.to === address ? (
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900">
                        {parseFloat(tx.amount).toFixed(2)} {tx.asset}
                      </div>
                      <div className="text-xs text-gray-400 font-mono truncate">
                        {tx.from.slice(0, 8)}...
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {timeAgo(tx.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
