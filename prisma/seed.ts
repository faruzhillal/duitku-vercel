import {
  PrismaClient,
  StatusUtang,
  StatusTitipan,
} from "../app/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_CATEGORIES = [
  // Kategori Pengeluaran
  { name: "Makan/Minuman", type: "expense", icon: "Utensils", color: "#f97316" },
  { name: "Transport", type: "expense", icon: "Car", color: "#0ea5e9" },
  { name: "Akademik", type: "expense", icon: "GraduationCap", color: "#8b5cf6" },
  { name: "Kesehatan", type: "expense", icon: "HeartPulse", color: "#ef4444" },
  { name: "Hiburan", type: "expense", icon: "Film", color: "#ec4899" },
  { name: "Tagihan", type: "expense", icon: "Receipt", color: "#eab308" },
  { name: "Tabungan", type: "expense", icon: "PiggyBank", color: "#10b981" },
  { name: "Bayar Utang", type: "expense", icon: "HandCoins", color: "#64748b" },
  { name: "Lain-lain", type: "expense", icon: "MoreHorizontal", color: "#94a3b8" },

  // Kategori Pemasukan
  { name: "Gaji", type: "income", icon: "Wallet", color: "#22c55e" },
  { name: "Magang", type: "income", icon: "Briefcase", color: "#3b82f6" },
  { name: "Uang Saku", type: "income", icon: "Gift", color: "#06b6d4" },
  { name: "Bonus", type: "income", icon: "Sparkles", color: "#eab308" },
  { name: "Lain-lain", type: "income", icon: "PlusCircle", color: "#a855f7" },
];

export async function seedDefaultCategories(userId?: string) {
  console.log("Seeding default categories...");

  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.kategori.findFirst({
      where: {
        name: cat.name,
        userId: userId || null,
      },
    });

    if (!existing) {
      await prisma.kategori.create({
        data: {
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          userId: userId || null,
        },
      });
    }
  }

  console.log("Default categories seeded!");
}

async function main() {
  console.log("Starting database seed...");

  // 1. Seed Global Categories
  await seedDefaultCategories();

  // 2. Seed Default User (Akun Demo)
  const demoEmail = "user@duitku.app";
  let user = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (!user) {
    console.log("Creating default demo user: user@duitku.app / password123");
    const hashedPassword = await bcrypt.hash("password123", 10);
    user = await prisma.user.create({
      data: {
        email: demoEmail,
        name: "Pengguna Demo DuitKu",
        password: hashedPassword,
      },
    });
  } else {
    console.log("Demo user already exists:", user.email);
  }

  // 1. Seed Accounts
  const existingAccounts = await prisma.akun.findMany({
    where: { userId: user.id },
  });

  if (existingAccounts.length === 0) {
    console.log("Seeding initial accounts for demo user...");
    const bca = await prisma.akun.create({
      data: {
        userId: user.id,
        name: "BCA Payroll",
        type: "bank",
        initialBalance: 5000000,
        currentBalance: 5000000,
      },
    });

    const gopay = await prisma.akun.create({
      data: {
        userId: user.id,
        name: "GoPay",
        type: "ewallet",
        initialBalance: 350000,
        currentBalance: 350000,
      },
    });

    const tunai = await prisma.akun.create({
      data: {
        userId: user.id,
        name: "Dompet Tunai",
        type: "cash",
        initialBalance: 150000,
        currentBalance: 150000,
      },
    });

    const kasTitipan = await prisma.akun.create({
      data: {
        userId: user.id,
        name: "Rekening Titipan Panitia",
        type: "bank",
        initialBalance: 1200000,
        currentBalance: 1200000,
        isEntrusted: true,
      },
    });

    // 2. Seed Uang Titipan (Amanah)
    await prisma.uangTitipan.create({
      data: {
        userId: user.id,
        owner: "Panitia Wisuda Kampus",
        amount: 1200000,
        status: "held",
        note: "Harap ditransfer kembali sebelum H-3",
      },
    });

    // 3. Seed Utang & Piutang
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await prisma.utang.create({
      data: {
        userId: user.id,
        namaPihak: "Budi Santoso",
        jumlah: 250000,
        tipe: "PIUTANG",
        jatuhTempo: dueDate,
        status: StatusUtang.BELUM_LUNAS,
        catatan: "Talangan beli buku kuliah",
      },
    });

    await prisma.utang.create({
      data: {
        userId: user.id,
        namaPihak: "Indomaret / Tagihan WiFi",
        jumlah: 350000,
        tipe: "UTANG",
        jatuhTempo: dueDate,
        status: StatusUtang.BELUM_LUNAS,
        catatan: "Tagihan IndiHome bulanan",
      },
    });

    // 4. Seed Contoh Transaksi
    const katMakan = await prisma.kategori.findFirst({
      where: { name: "Makan/Minuman" },
    });
    const katTransport = await prisma.kategori.findFirst({
      where: { name: "Transport" },
    });
    const katMagang = await prisma.kategori.findFirst({
      where: { name: "Magang" },
    });

    if (katMakan) {
      await prisma.transaksi.create({
        data: {
          userId: user.id,
          accountId: gopay.id,
          categoryId: katMakan.id,
          amount: 35000,
          type: "expense",
          paymentMethod: "qris",
          date: new Date(),
          note: "Makan siang ayam geprek",
        },
      });
    }

    if (katTransport) {
      await prisma.transaksi.create({
        data: {
          userId: user.id,
          accountId: tunai.id,
          categoryId: katTransport.id,
          amount: 50000,
          type: "expense",
          paymentMethod: "cash",
          date: new Date(),
          note: "Bensin motor full tank",
        },
      });
    }

    if (katMagang) {
      await prisma.transaksi.create({
        data: {
          userId: user.id,
          accountId: bca.id,
          categoryId: katMagang.id,
          amount: 2500000,
          type: "income",
          paymentMethod: "transfer",
          date: new Date(),
          note: "Uang saku magang bulan lalu",
        },
      });
    }

    console.log("Initial seed data populated successfully!");
  } else {
    console.log("Demo user data already exists, skipping initial accounts seed.");
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
