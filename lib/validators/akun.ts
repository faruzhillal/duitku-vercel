import { z } from "zod";

export const baseAkunSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi").max(50),
  type: z.enum(["cash", "bank", "ewallet", "emoney"]),
  initialBalance: z.coerce.number().min(0, "Saldo tidak boleh negatif"),
  icon: z.string().optional(),
  color: z.string().optional(),
  isEntrusted: z.boolean(),
  owner: z.string().optional(),
});

export const akunSchema = baseAkunSchema.refine(
  (data) => !data.isEntrusted || (data.isEntrusted && !!data.owner),
  { message: "Nama pemilik wajib diisi untuk uang titipan", path: ["owner"] }
);

export const updateAkunSchema = baseAkunSchema.partial();
export type AkunInput = z.infer<typeof akunSchema>;
