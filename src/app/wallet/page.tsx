"use client";

import { StellarWalletPanel } from "@/components/wallet/stellar-wallet-panel";

export default function WalletPage() {
  return (
    <main className="min-h-screen bg-gray-50 pt-20 pb-16 px-4">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Stellar Wallet — Freighter Integration
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Detect, connect, and transact on Stellar Testnet using Freighter
          </p>
        </div>
        <StellarWalletPanel />
      </div>
    </main>
  );
}
