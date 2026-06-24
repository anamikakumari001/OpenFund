"use client";

import { useState, useCallback } from "react";
import { detectFreighter, connectWallet, signTx } from "@/lib/stellar-wallet";
import { fetchXlmBalance, buildPaymentXdr, submitSignedTx } from "@/lib/stellar-sdk";

interface WalletState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const setPartial = (partial: Partial<WalletState>) =>
    setState((s) => ({ ...s, ...partial }));

  const connect = useCallback(async () => {
    setPartial({ isLoading: true, error: null });
    try {
      const detected = await detectFreighter();
      if (!detected) {
        setPartial({
          isLoading: false,
          error: "Freighter extension not found. Please install it from freighter.app",
        });
        return;
      }
      const address = await connectWallet();
      let balance: string | null = null;
      try {
        balance = await fetchXlmBalance(address);
      } catch (err) {
        if (err instanceof Error && err.message === "ACCOUNT_NOT_FOUND") {
          balance = null;
        }
      }
      setState({ address, balance, isConnected: true, isLoading: false, error: null });
    } catch (err) {
      setPartial({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to connect wallet",
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ address: null, balance: null, isConnected: false, isLoading: false, error: null });
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.address) return;
    setPartial({ isLoading: true, error: null });
    try {
      const balance = await fetchXlmBalance(state.address);
      setPartial({ balance, isLoading: false });
    } catch (err) {
      if (err instanceof Error && err.message === "ACCOUNT_NOT_FOUND") {
        setPartial({ balance: null, isLoading: false });
      } else {
        setPartial({
          isLoading: false,
          error: "Failed to fetch balance",
        });
      }
    }
  }, [state.address]);

  const sendXlm = useCallback(
    async (to: string, amount: string): Promise<{ hash: string }> => {
      if (!state.address) throw new Error("Wallet not connected");
      const xdr = await buildPaymentXdr(state.address, to, amount);
      const signedXdr = await signTx(xdr);
      const result = await submitSignedTx(signedXdr);
      try {
        const newBalance = await fetchXlmBalance(state.address);
        setPartial({ balance: newBalance });
      } catch {
        // balance refresh is best-effort
      }
      return result;
    },
    [state.address]
  );

  return { ...state, connect, disconnect, refreshBalance, sendXlm };
}
