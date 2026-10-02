import { z } from "zod";

export const transaksiSchema = z
  .object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Tanggal tidak valid",
    }),
    amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
    type: z.enum(["income", "expense", "transfer"]),
    accountId: z
      .string()
      .min(1, "Akun wajib dipilih"),
    categoryId: z
      .string()
      .optional(),
    transferToId: z
      .string()
      .optional(),
    paymentMethod: z.enum(["cash", "qris", "transfer", "ewallet"]).optional(),
    note: z.string().max(200, "Catatan maksimal 200 karakter").optional(),
    tags: z.array(z.string()).optional(),
  })
  .refine((data) => data.type !== "transfer" || !!data.transferToId, {
    message: "Akun tujuan wajib dipilih untuk transfer",
    path: ["transferToId"],
  })
  .refine((data) => data.type === "transfer" || !!data.categoryId, {
    message: "Kategori wajib dipilih",
    path: ["categoryId"],
  })
  .refine(
    (data) => !data.transferToId || data.transferToId !== data.accountId,
    {
      message: "Akun asal dan tujuan tidak boleh sama",
      path: ["transferToId"],
    }
  );

export const updateTransaksiSchema = transaksiSchema;
export type TransaksiInput = z.infer<typeof transaksiSchema>;
