import { z } from "zod";

export const rekonsiliasiSchema = z.object({
  accountId: z.string().min(1, "Akun wajib dipilih"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Tanggal tidak valid",
  }),
  actualBalance: z.coerce.number(),
  reason: z.string().min(5, "Alasan wajib diisi minimal 5 karakter").max(300),
});

export type RekonsiliasiInput = z.infer<typeof rekonsiliasiSchema>;
