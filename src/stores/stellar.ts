"use client";

import { create } from "zustand";

type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

interface StellarStore {
  publicKey: string | null;
  status: WalletStatus;
  network: "testnet" | "mainnet";
  setPublicKey: (key: string | null) => void;
  setStatus: (status: WalletStatus) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useStellarStore = create<StellarStore>((set) => ({
  publicKey: null,
  status: "disconnected",
  network: (process.env.NEXT_PUBLIC_STELLAR_NETWORK as "testnet" | "mainnet") || "testnet",
  setPublicKey: (key) => set({ publicKey: key }),
  setStatus: (status) => set({ status }),
  connect: async () => {
    set({ status: "connecting" });
    try {
      const freighter = await import("@stellar/freighter-api");
      const connected = await freighter.isConnected();
      if (!connected.isConnected) {
        await freighter.requestAccess();
      }
      const result = await freighter.getAddress();
      if ("error" in result && result.error) {
        throw new Error(String(result.error));
      }
      const address = "address" in result ? result.address : null;
      if (!address) throw new Error("No address returned");
      set({ publicKey: address, status: "connected" });
    } catch (err) {
      console.error("Freighter error:", err);
      set({ status: "error" });
    }
  },
  disconnect: () => {
    set({ publicKey: null, status: "disconnected" });
  },
}));
