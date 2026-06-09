# Cashier Dashboard & Manager Chart Mobile Fix

Perubahan:

1. Grafik dashboard manager diperbaiki agar tidak keluar layar di mobile.
   - Wrapper chart tidak lagi dipaksa memiliki `min-width` besar.
   - Bar chart dibuat responsif dengan gap dan label lebih kecil di layar HP.
   - Production chart manager juga diberi `min-w-0`, `truncate`, dan padding mobile.

2. Dashboard Kasir ditambahkan sesuai PDF.
   - Fokus role kasir: POS, transaksi offline, pesanan online, perubahan status order, riwayat transaksi, data produk, dan stok produk.
   - Menggunakan tema Beard Papa's yang sama dengan Manager dan Staff.
   - Dummy data sudah API-ready melalui `cashier.service.ts`.

3. Build berhasil.
