"use client";

import { useState, useCallback } from "react";
import { Transaction } from "@/types";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Akan diimplementasikan saat modul Transaksi selesai
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat memuat transaksi");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    setTransactions,
  };
}
