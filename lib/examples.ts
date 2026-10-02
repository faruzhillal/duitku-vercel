/**
 * ============================================================================
 * CONTOH PENGGUNAAN TYPES, VALIDATORS, CONSTANTS, & UTILS DI DUITKU
 * ============================================================================
 */

/*
// ----------------------------------------------------------------------------
// 1. Contoh di Server Component / Server Action:
// ----------------------------------------------------------------------------

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { serializeDecimal, formatRupiah } from "@/lib/utils";
import type { AkunWithStats, ActionResult } from "@/types";

export async function getAccountsWithStats(): Promise<ActionResult<AkunWithStats[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  const akun = await prisma.akun.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { transaksiAsal: true },
      },
    },
  });

  // Serialize Prisma Decimal ke Number sebelum dikirim ke Client Component
  const serialized = serializeDecimal(akun);

  return {
    success: true,
    data: serialized as unknown as AkunWithStats[],
  };
}

// ----------------------------------------------------------------------------
// 2. Contoh di Client Component dengan React Hook Form & Zod:
// ----------------------------------------------------------------------------

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { akunSchema, type AkunInput } from "@/lib/validators/akun";
import { TIPE_AKUN_OPTIONS, AKUN_COLORS } from "@/lib/constants";
import { formatRupiah } from "@/lib/utils";

export function FormTambahAkun() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AkunInput>({
    resolver: zodResolver(akunSchema),
    defaultValues: {
      name: "",
      type: "bank",
      initialBalance: 0,
      isEntrusted: false,
      color: AKUN_COLORS[0],
    },
  });

  const isEntrusted = watch("isEntrusted");

  const onSubmit = async (data: AkunInput) => {
    console.log("Valid Account Data:", data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label>Nama Akun</label>
        <input {...register("name")} placeholder="cth: BCA Payroll" />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <label>Tipe Akun</label>
        <select {...register("type")}>
          {TIPE_AKUN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.icon} {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Saldo Awal</label>
        <input type="number" {...register("initialBalance")} />
        {errors.initialBalance && (
          <p className="text-red-500">{errors.initialBalance.message}</p>
        )}
      </div>

      <div>
        <label>
          <input type="checkbox" {...register("isEntrusted")} />
          Akun Uang Titipan Orang Lain
        </label>
      </div>

      {isEntrusted && (
        <div>
          <label>Nama Pemilik / Penitip Uang</label>
          <input {...register("owner")} placeholder="cth: Ibu Kos" />
          {errors.owner && <p className="text-red-500">{errors.owner.message}</p>}
        </div>
      )}

      <button type="submit" disabled={isSubmitting}>
        Simpan Akun
      </button>
    </form>
  );
}
*/
export {};
