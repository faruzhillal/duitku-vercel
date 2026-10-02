"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAccounts() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const accounts = await prisma.akun.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return accounts.map((acc) => ({
    ...acc,
    nama: acc.name,
    tipe: acc.type,
    saldoAwal: Number(acc.initialBalance),
    saldoSekarang: Number(acc.currentBalance),
    mataUang: acc.currency,
    ikon: acc.icon,
    isTitipan: acc.isEntrusted,
  }));
}

export async function createAccount(data: {
  nama: string;
  tipe?: string;
  saldoAwal: number;
  mataUang?: string;
  ikon?: string;
  isTitipan?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  try {
    const account = await prisma.akun.create({
      data: {
        userId: session.user.id,
        name: data.nama,
        type: data.tipe || "cash",
        initialBalance: data.saldoAwal,
        currentBalance: data.saldoAwal,
        currency: data.mataUang || "IDR",
        icon: data.ikon || null,
        isEntrusted: data.isTitipan || false,
      },
    });

    revalidatePath("/accounts");
    revalidatePath("/");
    return {
      success: true,
      account: {
        ...account,
        nama: account.name,
        saldoAwal: Number(account.initialBalance),
        saldoSekarang: Number(account.currentBalance),
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat akun",
    };
  }
}

export async function updateAccount(
  id: string,
  data: {
    nama?: string;
    tipe?: string;
    ikon?: string;
    isTitipan?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  try {
    const updated = await prisma.akun.update({
      where: { id, userId: session.user.id },
      data: {
        ...(data.nama ? { name: data.nama } : {}),
        ...(data.tipe ? { type: data.tipe } : {}),
        ...(data.ikon ? { icon: data.ikon } : {}),
        ...(data.isTitipan !== undefined ? { isEntrusted: data.isTitipan } : {}),
      },
    });

    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true, account: updated };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui akun",
    };
  }
}

export async function deleteAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  try {
    await prisma.akun.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus akun",
    };
  }
}
