# Update Dashboard Manager

Versi ini memfokuskan pengerjaan pada Dashboard Manager agar siap diintegrasikan dengan backend Express.js.

## Endpoint yang disiapkan

- GET /api/dashboard?period=today|week|month|year
- GET /api/dashboard/export?period=today|week|month|year

Jika backend belum berjalan, service dashboard otomatis memakai mock data dari:

- src/data/mockDashboard.ts

## File utama yang berubah / ditambahkan

- src/pages/manager/Dashboard.tsx
- src/services/dashboard.service.ts
- src/types/dashboard.ts
- src/data/mockDashboard.ts
- src/components/dashboard/SalesChart.tsx
- src/components/dashboard/ProductionChart.tsx
- src/components/dashboard/SummaryCard.tsx
- src/components/common/Loading.tsx
- src/components/common/StatusBadge.tsx
- src/components/common/Toast.tsx
- src/components/layout/Sidebar.tsx
- src/routes/AppRoutes.tsx

## Fitur Dashboard Manager

- Summary card dinamis
- Filter periode: hari ini, minggu ini, bulan ini, tahun ini
- Loading overlay
- Toast success / info
- Modal detail metrik
- Modal detail stok
- Modal detail transaksi
- Modal detail produksi
- Modal konfirmasi export
- Modal success export
- Grafik penjualan animasi
- Grafik produksi animasi
- Produk terlaris
- Stok menipis
- Transaksi terbaru
- Produksi terbaru
- Quick action ke Produk, Produksi, Inventory, Laporan
- Sidebar manager menambahkan Stock Movement

## Build check

Perintah sudah dites:

npm run build

Hasil: berhasil.
