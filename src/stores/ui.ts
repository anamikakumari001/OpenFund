"use client";

import { create } from "zustand";

interface UIStore {
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  donationModalProject: string | null;
  setDonationModalProject: (projectId: string | null) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  donationModalProject: null,
  setDonationModalProject: (projectId) => set({ donationModalProject: projectId }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
