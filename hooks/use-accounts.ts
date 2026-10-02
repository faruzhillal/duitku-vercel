"use client";

import { useState, useCallback } from "react";
import { useAccountStore } from "@/store/account-store";
import { Account } from "@/types";

export function useAccounts() {
  const { accounts, selectedAccountId, setAccounts, setSelectedAccountId } = useAccountStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Placeholder hook untuk integrasi Firestore nanti
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Akan diimplementasikan saat modul Accounts selesai
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat akun");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    accounts,
    selectedAccountId,
    loading,
    error,
    fetchAccounts,
    setSelectedAccountId,
    setAccounts,
  };
}
