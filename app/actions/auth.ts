"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    email: z.string().email("Format email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export type RegisterState = {
  success: boolean;
  error?: string;
};

export async function registerUser(formData: FormData): Promise<RegisterState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validation = registerSchema.safeParse(rawData);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Data formulir tidak valid",
    };
  }

  const { name, email, password } = validation.data;
  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    // Seed default categories for newly registered user
    const { seedDefaultKategori } = await import("@/lib/seed-kategori");
    await seedDefaultKategori(newUser.id);

    return { success: true };
  } catch (error: unknown) {
    console.error("Register Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan saat pendaftaran",
    };
  }
}
