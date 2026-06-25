"use client";

import { useState, useEffect } from "react";
import {
  ExternalLink,
  RefreshCw,
  Send,
  Wallet,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { detectFreighter } from "@/lib/stellar-wallet";
import { useWallet } from "@/hooks/use-stellar-wallet";

export function StellarWalletPanel() {
  const {
    address,
    balance,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
    refreshBalance,
    sendXlm,
  } = useWallet();

  const [freighterDetected, setFreighterDetected] = useState<boolean | null>(null);
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [txLoading, setTxLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    detectFreighter().then(setFreighterDetected);
  }, []);

  const handleSend = async () => {
    setTxHash(null);
    setTxError(null);
    if (!destination.trim() || !amount.trim()) {
      setTxError("Destination address and amount are required.");
      return;
    }
    setTxLoading(true);
    try {
      const result = await sendXlm(destination.trim(), amount.trim());
      setTxHash(result.hash);
      setDestination("");
      setAmount("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setTxError(msg);
    } finally {
      setTxLoading(false);
    }
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayBalance = (): string => {
    if (balance === null) return "0 XLM (account not funded)";
    return `${parseFloat(balance).toFixed(7)} XLM`;
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Stellar Wallet</h2>
            <p className="text-xs text-gray-500">Freighter · Testnet</p>
          </div>
        </div>

        {/* Step 1 — Install Freighter */}
        {freighterDetected === false && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Freighter extension not detected</span>
            </div>
            <p className="text-xs text-amber-600">
              Freighter is a Stellar wallet browser extension required to use this app.
            </p>
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
            >
              Install Freighter
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Step 2 — Connect wallet */}
        {freighterDetected !== false && !isConnected && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Connect your Freighter wallet to view your balance and send XLM on Stellar Testnet.
            </p>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
            <button
              onClick={connect}
              disabled={isLoading || freighterDetected === null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              {isLoading ? "Connecting…" : "Connect Wallet"}
            </button>
          </div>
        )}

        {/* Step 3 — Connected state */}
        {isConnected && address && (
          <div className="space-y-4">
            {/* Address */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Wallet Address
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={copyAddress}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={disconnect}
                    className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Disconnect"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">
                {address}
              </p>
            </div>

            {/* Balance */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  XLM Balance
                </span>
                <button
                  onClick={refreshBalance}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
              <p className="text-2xl font-bold text-blue-700 font-mono">
                {displayBalance()}
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Send XLM form — only shown when connected */}
      {isConnected && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-gray-900">
            <Send className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold">Send XLM</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Destination Address
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="G…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Amount (XLM)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0000000"
                min="0"
                step="0.0000001"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/20 transition-all"
              />
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={txLoading || !destination || !amount}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {txLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {txLoading ? "Signing & Sending…" : "Send XLM"}
          </button>

          {/* Transaction result */}
          {txHash && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Transaction sent!</span>
              </div>
              <p className="text-xs text-green-600 font-mono break-all">Hash: {txHash}</p>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 underline underline-offset-2"
              >
                View on Stellar Expert
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {txError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Transaction failed</span>
              </div>
              <p className="text-xs text-red-600 break-all">{txError}</p>
            </div>
          )}
        </div>
      )}

      {/* Testnet notice */}
      <p className="text-center text-xs text-gray-400">
        Connected to{" "}
        <a
          href="https://horizon-testnet.stellar.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-600"
        >
          Stellar Testnet
        </a>{" "}
        · Fund your testnet account at{" "}
        <a
          href="https://laboratory.stellar.org/friendbot"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-gray-600"
        >
          Friendbot
        </a>
      </p>
    </div>
  );
}
