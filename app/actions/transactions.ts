"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getTransactions(filters?: {
  akunId?: string;
  kategoriId?: string;
  tipe?: string;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const whereClause: Record<string, unknown> = {
    userId: session.user.id,
  };

  if (filters?.akunId) {
    whereClause.OR = [
      { accountId: filters.akunId },
      { transferToId: filters.akunId },
    ];
  }
  if (filters?.kategoriId) {
    whereClause.categoryId = filters.kategoriId;
  }
  if (filters?.tipe) {
    whereClause.type = filters.tipe;
  }

  const transactions = await prisma.transaksi.findMany({
    where: whereClause,
    include: {
      akun: true,
      akunTujuan: true,
      kategori: true,
    },
    orderBy: { date: "desc" },
    take: filters?.limit || 50,
  });

  return transactions.map((t) => ({
    ...t,
    nominal: Number(t.amount),
    tanggal: t.date,
    tipe: t.type,
    akunId: t.accountId,
    akunTujuanId: t.transferToId,
    kategoriId: t.categoryId,
    akun: {
      ...t.akun,
      nama: t.akun.name,
      saldoAwal: Number(t.akun.initialBalance),
      saldoSekarang: Number(t.akun.currentBalance),
    },
    akunTujuan: t.akunTujuan
      ? {
          ...t.akunTujuan,
          nama: t.akunTujuan.name,
          saldoAwal: Number(t.akunTujuan.initialBalance),
          saldoSekarang: Number(t.akunTujuan.currentBalance),
        }
      : null,
    kategori: t.kategori
      ? {
          ...t.kategori,
          nama: t.kategori.name,
          warna: t.kategori.color,
          ikon: t.kategori.icon,
        }
      : null,
  }));
}

export async function createTransaction(data: {
  akunId: string;
  akunTujuanId?: string;
  kategoriId?: string;
  nominal: number;
  tipe: string;
  metodePembayaran?: string;
  tanggal: string; // ISO date string
  catatan?: string;
  tag?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }
  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const isTransfer = data.tipe === "transfer" || data.tipe === "TRANSFER";
      const isIncome = data.tipe === "income" || data.tipe === "PEMASUKAN";
      const isExpense = data.tipe === "expense" || data.tipe === "PENGELUARAN";

      // 1. Catat transaksi
      const trx = await tx.transaksi.create({
        data: {
          userId,
          accountId: data.akunId,
          transferToId: isTransfer ? data.akunTujuanId : null,
          categoryId: isTransfer ? null : data.kategoriId,
          amount: data.nominal,
          type: isIncome ? "income" : isExpense ? "expense" : "transfer",
          paymentMethod: data.metodePembayaran || "cash",
          date: new Date(data.tanggal),
          note: data.catatan || null,
          tags: data.tag || [],
        },
      });

      // 2. Update saldo akun secara atomik
      if (isIncome) {
        await tx.akun.update({
          where: { id: data.akunId },
          data: {
            currentBalance: { increment: data.nominal },
          },
        });
      } else if (isExpense) {
        await tx.akun.update({
          where: { id: data.akunId },
          data: {
            currentBalance: { decrement: data.nominal },
          },
        });
      } else if (isTransfer && data.akunTujuanId) {
        await tx.akun.update({
          where: { id: data.akunId },
          data: {
            currentBalance: { decrement: data.nominal },
          },
        });
        await tx.akun.update({
          where: { id: data.akunTujuanId },
          data: {
            currentBalance: { increment: data.nominal },
          },
        });
      }

      return trx;
    });

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/");
    return {
      success: true,
      transaction: {
        ...result,
        nominal: Number(result.amount),
        tanggal: result.date,
        tipe: result.type,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mencatat transaksi",
    };
  }
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }
  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const trx = await tx.transaksi.findUnique({
        where: { id, userId },
      });

      if (!trx) {
        throw new Error("Transaksi tidak ditemukan");
      }

      const isTransfer = trx.type === "transfer";
      const isIncome = trx.type === "income";
      const isExpense = trx.type === "expense";

      // Revert saldo
      if (isIncome) {
        await tx.akun.update({
          where: { id: trx.accountId },
          data: { currentBalance: { decrement: trx.amount } },
        });
      } else if (isExpense) {
        await tx.akun.update({
          where: { id: trx.accountId },
          data: { currentBalance: { increment: trx.amount } },
        });
      } else if (isTransfer && trx.transferToId) {
        await tx.akun.update({
          where: { id: trx.accountId },
          data: { currentBalance: { increment: trx.amount } },
        });
        await tx.akun.update({
          where: { id: trx.transferToId },
          data: { currentBalance: { decrement: trx.amount } },
        });
      }

      await tx.transaksi.delete({
        where: { id },
      });
    });

    revalidatePath("/transactions");
    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus transaksi",
    };
  }
}
