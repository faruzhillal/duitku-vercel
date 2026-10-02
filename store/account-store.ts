import { create } from "zustand";
import { Account } from "@/types";

interface AccountState {
  accounts: Account[];
  selectedAccountId: string | null;
  isLoading: boolean;
  setAccounts: (accounts: Account[]) => void;
  setSelectedAccountId: (id: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAccountStore = create<AccountState>((set) => ({
  accounts: [],
  selectedAccountId: null,
  isLoading: false,
  setAccounts: (accounts) => set({ accounts }),
  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  setLoading: (isLoading) => set({ isLoading }),
}));
