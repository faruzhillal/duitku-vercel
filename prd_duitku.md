# PRD: DuitKu — Personal Finance PWA

**Versi:** 1.0 (MVP)  
**Tanggal:** 26 September 2026  
**Author:** [Nama Kamu]  
**Platform:** PWA (Progressive Web App)  
**Status:** Draft untuk Google AI Studio  
**Lisensi:** Personal Use

---

## Daftar Isi

1. [Ringkasan Produk](#1-ringkasan-produk)
2. [Target User](#2-target-user)
3. [Problem Statement](#3-problem-statement)
4. [Fitur MVP](#4-fitur-mvp-wajib-ada)
5. [Fitur Future](#5-fitur-future-post-mvp)
6. [User Stories](#6-user-stories-mvp)
7. [Struktur Data](#7-struktur-data)
8. [Tech Stack](#8-tech-stack)
9. [Timeline](#9-timeline-rekomendasi)
10. [Success Metrics](#10-success-metrics)
11. [Prompt Google AI Studio](#11-prompt-untuk-google-ai-studio)
12. [Risiko & Mitigasi](#12-risiko--mitigasi)
13. [Aturan Pengembangan](#13-aturan-pengembangan)
14. [Langkah Selanjutnya](#14-langkah-selanjutnya)
15. [Catatan Kritis](#15-catatan-kritis)

---

## 1. Ringkasan Produk

**DuitKu** adalah PWA pencatat keuangan pribadi yang dirancang untuk mahasiswa dan pekerja muda Indonesia yang punya:

- Multi-akun (tunai, bank, e-wallet, e-money)
- Uang titipan orang lain
- Utang & piutang
- Pemasukan tidak tetap

**Value Proposition:**  
Catat keuangan dalam <5 detik pakai bahasa natural, pahami net worth riil, dan pisahkan uang pribadi dari uang titipan — semua di satu PWA gratis.

---

## 2. Target User

### User Utama (MVP)

- **Kamu sendiri** — mahasiswa, magang, multi-akun, pegang uang titipan

### User Potensial (Future)

- Mahasiswa dengan pemasukan tidak tetap
- Pekerja muda multi-akun
- Orang yang pegang uang titipan/utang
- Keluarga yang mau sharing budget

---

## 3. Problem Statement

| Masalah | Dampak |
|---|---|
| Uang titipan tercampur uang pribadi | Net worth tidak akurat |
| Tidak ada rekonsiliasi saldo | Selisih tidak terdeteksi |
| Input transaksi ribet | Malas catat |
| Tidak ada insight | Tidak tahu ke mana uang pergi |
| Multi-akun tidak terintegrasi | Sulit lacak saldo riil |
| Utang/piutang tidak terdokumentasi | Lupa, salah hitung |

---

## 4. Fitur MVP (Wajib Ada)

### 4.1 Manajemen Akun

- CRUD akun: Tunai, Bank, E-Wallet, E-Money
- Field: nama, tipe, saldo awal, saldo sekarang, mata uang, ikon
- **Pisahkan akun pribadi vs akun titipan**

### 4.2 Pencatatan Transaksi

- Input: nominal, kategori, akun, tanggal, catatan, metode bayar
- Tipe: pemasukan, pengeluaran, transfer antar akun
- Edit/hapus dengan audit trail
- **Quick add** — input <5 detik

### 4.3 Kategori & Tag

- Kategori default: Makan/Minuman, Transport, Akademik, Kesehatan, Hiburan, Tagihan, Tabungan, Bayar Utang
- Sub-kategori opsional
- Tag konteks: #onsite, #magang, #darurat

### 4.4 Utang & Piutang

- Catat utang (liabilitas) & piutang (aset)
- Field: orang, jumlah, tipe, jatuh tempo, status, catatan
- Reminder jatuh tempo
- Riwayat pembayaran

### 4.5 Uang Titipan (Fitur Kunci)

- Catat uang orang lain yang kamu pegang
- Field: pemilik, jumlah, status, catatan
- **Tidak dihitung sebagai aset** — masuk liabilitas
- Lacak jika dipinjam orang lain

### 4.6 Rekonsiliasi Saldo

- Input saldo riil per akun
- Sistem hitung selisih
- Adjustment dengan alasan wajib
- Audit trail

### 4.7 Dashboard

- Net worth (aset pribadi + piutang − utang)
- Saldo per akun
- Pengeluaran hari ini/bulan ini
- Grafik tren 7/30 hari

### 4.8 AI Natural Language Input ⭐

- Input: "Hari ini beli kopi 64rb pakai QRIS BCA"
- AI parse → transaksi otomatis
- Konfirmasi sebelum simpan
- Fallback ke form manual jika gagal

### 4.9 AI Chatbot Advisor ⭐

- Tanya: "Berapa pengeluaran jajan bulan ini?"
- Tanya: "Saran biar bisa nabung 500rb/bulan?"
- Konteks: data keuangan user
- Disclaimer: bukan financial advisor profesional

---

## 5. Fitur Future (Post-MVP)

- Import mutasi bank (CSV/PDF)
- Multi-user & sharing keluarga
- Budget per kategori dengan alert
- Proyeksi keuangan (forecast)
- Anomali detection
- Widget PWA
- Offline-first dengan sync
- Export Excel/CSV
- Dark mode
- Biometric lock

---

## 6. User Stories (MVP)

| ID | Sebagai | Saya ingin | Supaya |
|---|---|---|---|
| US-01 | User | Catat transaksi pakai bahasa natural | Cepat & tidak malas |
| US-02 | User | Lihat net worth riil | Tahu posisi keuangan |
| US-03 | User | Pisahkan uang titipan | Tidak salah hitung |
| US-04 | User | Catat utang/piutang | Tidak lupa |
| US-05 | User | Rekonsiliasi saldo | Deteksi selisih |
| US-06 | User | Tanya AI soal keuangan | Dapat insight |
| US-07 | User | Lihat pengeluaran per kategori | Tahu ke mana uang pergi |
| US-08 | User | Transfer antar akun | Lacak saldo akurat |

---

## 7. Struktur Data

```
User
├── id, name, email, created_at
├── Accounts[]
│   ├── id, name, type, initial_balance, current_balance
│   ├── currency, icon, is_entrusted, owner (jika titipan)
│   └── Transactions[]
│       ├── id, date, amount, type
│       ├── category_id, account_id, note, tags[]
│       └── payment_method, created_at, updated_at
├── Categories[]
│   ├── id, name, type, parent_id, icon, color
├── Debts[]
│   ├── id, person, amount, type, due_date, status, note
│   └── Payments[]
├── EntrustedFunds[]
│   ├── id, owner, amount, status, note, borrowed_by
├── Budgets[]
│   ├── id, category_id, amount, period, rollover
├── Reconciliations[]
│   ├── id, account_id, date, actual_balance, difference, reason
└── AI_Logs[]
    ├── id, input_text, parsed_result, success, timestamp
```

---

## 8. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Frontend | Next.js 14 + Tailwind | PWA-ready, cepat |
| PWA | next-pwa | Service worker otomatis |
| State | Zustand | Ringan |
| Backend | Firebase | Gratis, realtime |
| Database | Firestore | NoSQL, fleksibel |
| Auth | Firebase Auth | Google login |
| AI | Gemini API | Natural language + chatbot |
| Hosting | Vercel | Gratis, auto-deploy |
| UI | shadcn/ui | Komponen siap pakai |

---

## 9. Timeline Rekomendasi

| Fase | Durasi | Deliverable |
|---|---:|---|
| **Fase 0: Setup** | 1 minggu | Repo, Firebase, Gemini API key |
| **Fase 1: Core** | 2 minggu | Akun, transaksi, kategori, dashboard |
| **Fase 2: Utang/Titipan** | 1 minggu | Utang, piutang, uang titipan |
| **Fase 3: AI Input** | 1 minggu | Natural language input |
| **Fase 4: Rekonsiliasi** | 3 hari | Rekonsiliasi + adjustment |
| **Fase 5: AI Chatbot** | 1 minggu | Chatbot advisor |
| **Fase 6: Polish** | 1 minggu | UI/UX, PWA, testing |
| **Total** | **~7 minggu** | MVP siap pakai |

**Rekomendasi:** Mulai dari Fase 1 dulu. Jangan langsung AI. Pastikan core-nya solid.

---

## 10. Success Metrics

| Metrik | Target |
|---|---:|
| Waktu input transaksi | <5 detik |
| Akurasi AI parse | >90% |
| Retensi harian | >80% |
| Net worth accuracy | 100% |
| User puas | >4/5 |

---

## 11. Prompt untuk Google AI Studio

### 11.1 Prompt Setup Awal

```
Buatkan PWA personal finance bernama "DuitKu" dengan Next.js 14, 
Tailwind, Firebase, dan Gemini API. Fitur MVP: manajemen akun, 
transaksi, kategori, utang/piutang, uang titipan, rekonsiliasi, 
dashboard, AI natural language input, dan AI chatbot.

Struktur data: [paste struktur dari section 7]

Mulai dari:
1. Setup project Next.js + Tailwind + Firebase
2. Auth dengan Google
3. Layout dashboard
4. CRUD akun
```

### 11.2 Prompt Fitur AI Input

```
Buatkan komponen React untuk input transaksi via natural language.
User ketik: "Hari ini beli kopi 64rb pakai QRIS BCA"
Gemini API parse jadi:
{
  "date": "2026-09-26",
  "amount": 64000,
  "type": "expense",
  "category": "Makan/Minuman",
  "account": "BCA",
  "payment_method": "QRIS",
  "note": "Kopi"
}
Tampilkan konfirmasi sebelum simpan ke Firestore.
```

### 11.3 Prompt Fitur Chatbot

```
Buatkan chatbot advisor dengan Gemini API yang punya konteks 
data keuangan user (akun, transaksi, utang, piutang).
User bisa tanya: "Berapa pengeluaran jajan bulan ini?"
Bot jawab dengan data riil + saran.
Tambahkan disclaimer: bukan financial advisor profesional.
```

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| AI salah parse | Konfirmasi sebelum simpan |
| Data hilang | Backup Firestore otomatis |
| Lupa catat | Reminder harian |
| Over-engineering | Fokus MVP dulu |
| API cost | Gemini free tier, cache response |

---

## 13. Aturan Pengembangan

1. **Mobile-first** — 90% user pakai HP
2. **Quick add** — input <5 detik
3. **Offline-first** — catat tanpa internet
4. **Privacy** — data user terenkripsi
5. **Free** — jangan ada paywall di MVP
6. **Iterasi** — rilis cepat, feedback cepat

---

## 14. Langkah Selanjutnya

1. **Baca PRD ini** — pahami betul
2. **Setup Google AI Studio** — buka aistudio.google.com
3. **Copy prompt section 11.1** — mulai dari setup
4. **Iterasi fitur satu per satu** — jangan lompat
5. **Test tiap fitur** — sebelum lanjut
6. **Update PRD** — kalau ada perubahan

---

## 15. Catatan Kritis

**Untuk kamu pribadi:**

- PRD ini dibuat berdasarkan masalah riil kamu
- Fitur **uang titipan** dan **rekonsiliasi** adalah pembeda dari app lain
- AI input & chatbot adalah value utama — tapi jangan sampai core-nya jelek
- Timeline 7 minggu realistis kalau konsisten 1-2 jam/hari

**Peringatan:**

- Vibe coding itu cepat, tapi **testing tetap wajib**
- Jangan taruh data keuangan asli sebelum **backup** jalan
- Mulai dari **data dummy** dulu
- **Jangan** integrasi bank dulu — manual input dulu

---

## Lampiran A: Contoh Kasus Nyata (Onboarding)

Data awal user (kamu):

| Akun | Saldo |
|---|---:|
| Uang Tunai | Rp300.000 |
| Bank Mandiri | Rp100.000 |
| Bank BCA | Rp365.000 |
| **Total Uang Pribadi** | **Rp765.000** |
| Piutang ke Mama | Rp1.725.000 |
| Utang ke Saudara | -Rp1.000.000 |
| Utang ke Kakak | -Rp775.000 |
| **Net Worth** | **Rp715.000** |

Uang titipan yang dipegang: **Rp1.775.000** (bukan aset)

---

## Lampiran B: Glosarium

| Istilah | Definisi |
|---|---|
| Net Worth | Total aset dikurangi total utang |
| Uang Titipan | Uang milik orang lain yang kamu pegang |
| Piutang | Uang kamu yang ada di orang lain |
| Liabilitas | Kewajiban/utang yang harus dibayar |
| Rekonsiliasi | Proses mencocokkan saldo sistem dengan saldo riil |
| PWA | Progressive Web App — web yang bisa diinstall seperti app |
| MVP | Minimum Viable Product — versi paling minimal yang layak pakai |

---

**Akhir Dokumen**