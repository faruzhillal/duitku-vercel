import { z } from "zod";

export const kategoriSchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(50),
  type: z.enum(["income", "expense"]),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const updateKategoriSchema = kategoriSchema.partial();
export type KategoriInput = z.infer<typeof kategoriSchema>;
