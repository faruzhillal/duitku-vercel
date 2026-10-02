"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { createCategory } from "@/app/actions/categories";
import { TipeTransaksi } from "@/app/generated/prisma";

interface CategoryItem {
  id: string;
  nama: string;
  tipe: TipeTransaksi;
  warna: string | null;
  userId: string | null;
}

export function CategoriesClient({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [activeTab, setActiveTab] = useState<TipeTransaksi>(TipeTransaksi.PENGELUARAN);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [warna, setWarna] = useState("#0ea5e9");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const filteredCategories = categories.filter((c) => c.tipe === activeTab);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg("Nama kategori wajib diisi");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createCategory({
        nama: nama.trim(),
        tipe: activeTab,
        warna,
      });

      if (!res.success || !res.category) {
        throw new Error(res.error || "Gagal membuat kategori");
      }

      setCategories((prev) => [...prev, res.category as unknown as CategoryItem]);
      setIsModalOpen(false);
      setNama("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Kategori & Tag
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Kelola pengelompokan anggaran belanja dan sumber pemasukan.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-xs md:text-sm flex items-center justify-center gap-2 shadow-md shadow-sky-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-xs">
        <button
          onClick={() => setActiveTab(TipeTransaksi.PENGELUARAN)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === TipeTransaksi.PENGELUARAN
              ? "bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Pengeluaran
        </button>
        <button
          onClick={() => setActiveTab(TipeTransaksi.PEMASUKAN)}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === TipeTransaksi.PEMASUKAN
              ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Pemasukan
        </button>
      </div>

      {/* Grid Kategori */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: cat.warna || "#64748b" }}
            >
              <Tag className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {cat.nama}
              </p>
              <span className="text-[10px] text-slate-400">
                {cat.userId ? "Kustom Saya" : "Bawaan Sistem"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Kategori */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Kategori Kustom"
        description={`Kategori ${activeTab === TipeTransaksi.PENGELUARAN ? "Pengeluaran" : "Pemasukan"} baru`}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Nama Kategori
            </label>
            <input
              type="text"
              required
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Contoh: Skincare, Freelance Coding, Kopi"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Pilih Warna Label
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={warna}
                onChange={(e) => setWarna(e.target.value)}
                className="w-10 h-10 p-1 rounded-xl border border-slate-200 cursor-pointer bg-white"
              />
              <span className="text-xs text-slate-500 uppercase">{warna}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-md shadow-sky-500/20"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Kategori"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
