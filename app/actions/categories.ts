"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCategories() {
  const session = await auth();
  const userId = session?.user?.id;

  const categories = await prisma.kategori.findMany({
    where: {
      OR: [{ userId: null }, ...(userId ? [{ userId }] : [])],
    },
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    ...c,
    nama: c.name,
    tipe: c.type,
    ikon: c.icon,
    warna: c.color,
  }));
}

export async function createCategory(data: {
  nama: string;
  tipe: string;
  ikon?: string;
  warna?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Tidak terautentikasi" };
  }

  try {
    const category = await prisma.kategori.create({
      data: {
        userId: session.user.id,
        name: data.nama,
        type: data.tipe,
        icon: data.ikon || null,
        color: data.warna || "#64748b",
      },
    });

    revalidatePath("/categories");
    return {
      success: true,
      category: {
        ...category,
        nama: category.name,
        tipe: category.type,
        ikon: category.icon,
        warna: category.color,
      },
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat kategori",
    };
  }
}
