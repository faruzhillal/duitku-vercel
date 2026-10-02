"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rekonsiliasiAkun } from "@/app/(dashboard)/reconciliation/actions";

export async function getReconciliations(accountId?: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const reconciliations = await prisma.rekonsiliasi.findMany({
    where: {
      userId: session.user.id,
      ...(accountId ? { accountId } : {}),
    },
    include: { account: true },
    orderBy: { date: "desc" },
    take: 50,
  });

  return reconciliations.map((r) => ({
    id: r.id,
    userId: r.userId,
    accountId: r.accountId,
    date: r.date,
    systemBalance: Number(r.systemBalance),
    actualBalance: Number(r.actualBalance),
    difference: Number(r.difference),
    reason: r.reason,
    account: {
      ...r.account,
      nama: r.account.name,
      saldoAwal: Number(r.account.initialBalance),
      saldoSekarang: Number(r.account.currentBalance),
    },
    // Backward compatibility aliases
    saldoSistem: Number(r.systemBalance),
    saldoRiil: Number(r.actualBalance),
    selisih: Number(r.difference),
    catatan: r.reason,
    tanggal: r.date,
    akun: {
      ...r.account,
      nama: r.account.name,
      saldoAwal: Number(r.account.initialBalance),
      saldoSekarang: Number(r.account.currentBalance),
    },
  }));
}

export async function performReconciliation(data: {
  akunId: string;
  saldoRiil: number;
  catatan: string;
}) {
  return rekonsiliasiAkun({
    accountId: data.akunId,
    actualBalance: data.saldoRiil,
    reason: data.catatan,
  });
}
