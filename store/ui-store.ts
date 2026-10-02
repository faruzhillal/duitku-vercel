import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  isQuickAddOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setQuickAddOpen: (isOpen: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isQuickAddOpen: false,
  theme: "light",
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
  setQuickAddOpen: (isQuickAddOpen) => set({ isQuickAddOpen }),
  setTheme: (theme) => set({ theme }),
}));
