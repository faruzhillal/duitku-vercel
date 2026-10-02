import { z } from "zod";

export const utangSchema = z.object({
  person: z.string().min(1, "Nama orang wajib diisi").max(100),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  type: z.enum(["payable", "receivable"]),
  dueDate: z.string().optional(),
  note: z.string().max(200, "Catatan maksimal 200 karakter").optional(),
});

export const pembayaranUtangSchema = z.object({
  debtId: z.string().min(1, "ID Utang wajib diisi"),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Tanggal tidak valid",
  }),
  note: z.string().max(200, "Catatan maksimal 200 karakter").optional(),
});

export type UtangInput = z.infer<typeof utangSchema>;
export type PembayaranUtangInput = z.infer<typeof pembayaranUtangSchema>;
