import { z } from "zod";

export const titipanSchema = z.object({
  owner: z.string().min(1, "Nama pemilik wajib diisi").max(100),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  note: z.string().max(200, "Catatan maksimal 200 karakter").optional(),
});

export const pinjamTitipanSchema = z.object({
  id: z.string().min(1, "ID titipan wajib diisi"),
  borrowedBy: z.string().min(1, "Nama peminjam wajib diisi"),
});

export type TitipanInput = z.infer<typeof titipanSchema>;
export type PinjamTitipanInput = z.infer<typeof pinjamTitipanSchema>;
