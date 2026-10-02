"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEntrustedFunds() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const funds = await prisma.uangTitipan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return funds.map((f) => ({
    ...f,
    nominal: Number(f.amount),
    namaPenitip: f.owner,
    akun: {
      nama: "Uang Fisik Titipan",
      saldoAwal: 0,
      saldoSekarang: Number(f.amount),
    },
  }));
}

export async function createEntrustedFund(data: {
  namaPenitip: string;
  akunId: string;
  nominal: number;
  tujuan?: string;
  catatan?: string;
  tambahKeSaldoAkun?: boolean; // Pilihan apakah nominal ditambahkan ke saldo fisik akun terpilih
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }
  const userId = session.user.id;

  try {
    const fund = await prisma.uangTitipan.create({
      data: {
        userId,
        owner: data.namaPenitip,
        amount: data.nominal,
        note: data.catatan || null,
        status: "held",
      },
    });

    revalidatePath("/entrusted");
    revalidatePath("/accounts");
    revalidatePath("/");
    return {
      success: true,
      fund: {
        ...fund,
        nominal: Number(fund.amount),
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mencatat uang titipan",
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function returnEntrustedFund(id: string, _kurangiSaldoAkun: boolean = true) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }
  const userId = session.user.id;

  try {
    await prisma.uangTitipan.update({
      where: { id, userId },
      data: {
        status: "returned",
        returnedAt: new Date(),
        borrowedBy: null,
      },
    });

    revalidatePath("/entrusted");
    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengembalikan uang titipan",
    };
  }
}

export async function deleteEntrustedFund(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  try {
    await prisma.uangTitipan.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/entrusted");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus catatan uang titipan",
    };
  }
}
