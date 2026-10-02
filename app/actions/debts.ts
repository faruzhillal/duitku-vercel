"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { TipeUtang, StatusUtang } from "@/app/generated/prisma";

export async function getDebts() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const debts = await prisma.utang.findMany({
    where: { userId: session.user.id },
    include: {
      pembayaran: {
        include: { akun: true },
        orderBy: { tanggal: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return debts.map((d) => ({
    ...d,
    jumlah: Number(d.jumlah),
    jumlahTerbayar: Number(d.jumlahTerbayar),
    sisa: Number(d.jumlah) - Number(d.jumlahTerbayar),
    pembayaran: d.pembayaran.map((p) => ({
      ...p,
      nominal: Number(p.nominal),
      akun: p.akun
        ? {
            ...p.akun,
            nama: p.akun.name,
            saldoAwal: Number(p.akun.initialBalance),
            saldoSekarang: Number(p.akun.currentBalance),
          }
        : {
            nama: "Tidak ada akun",
            saldoAwal: 0,
            saldoSekarang: 0,
          },
    })),
  }));
}

export async function createDebt(data: {
  namaPihak: string;
  jumlah: number;
  tipe: TipeUtang;
  jatuhTempo?: string | null;
  catatan?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  try {
    const debt = await prisma.utang.create({
      data: {
        userId: session.user.id,
        namaPihak: data.namaPihak,
        jumlah: data.jumlah,
        tipe: data.tipe,
        jatuhTempo: data.jatuhTempo ? new Date(data.jatuhTempo) : null,
        catatan: data.catatan || null,
        status: StatusUtang.BELUM_LUNAS,
      },
    });

    revalidatePath("/debts");
    revalidatePath("/");
    return {
      success: true,
      debt: {
        ...debt,
        jumlah: Number(debt.jumlah),
        jumlahTerbayar: Number(debt.jumlahTerbayar),
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mencatat utang/piutang",
    };
  }
}

export async function recordDebtPayment(data: {
  utangId: string;
  akunId: string;
  nominal: number;
  catatan?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }
  const userId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      const debt = await tx.utang.findUnique({
        where: { id: data.utangId, userId },
      });

      if (!debt) throw new Error("Catatan utang/piutang tidak ditemukan");

      // 1. Simpan pembayaran
      await tx.pembayaranUtang.create({
        data: {
          utangId: data.utangId,
          akunId: data.akunId,
          nominal: data.nominal,
          catatan: data.catatan || null,
        },
      });

      // 2. Update status & jumlah terbayar
      const newTerbayar = Number(debt.jumlahTerbayar) + data.nominal;
      const totalJumlah = Number(debt.jumlah);
      const newStatus =
        newTerbayar >= totalJumlah
          ? StatusUtang.LUNAS
          : StatusUtang.DIBAYAR_SEBAGIAN;

      await tx.utang.update({
        where: { id: data.utangId },
        data: {
          jumlahTerbayar: newTerbayar,
          status: newStatus,
        },
      });

      // 3. Update saldo akun:
      // Jika UTANG (kita bayar orang) => saldo berkurang
      // Jika PIUTANG (orang bayar kita) => saldo bertambah
      if (debt.tipe === TipeUtang.UTANG) {
        await tx.akun.update({
          where: { id: data.akunId },
          data: { currentBalance: { decrement: data.nominal } },
        });
      } else {
        await tx.akun.update({
          where: { id: data.akunId },
          data: { currentBalance: { increment: data.nominal } },
        });
      }
    });

    revalidatePath("/debts");
    revalidatePath("/accounts");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memproses pembayaran",
    };
  }
}

export async function deleteDebt(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  try {
    await prisma.utang.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath("/debts");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus utang/piutang",
    };
  }
}
