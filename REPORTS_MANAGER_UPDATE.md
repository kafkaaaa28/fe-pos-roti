# Update Tab Laporan Manager

Perbaikan yang ditambahkan tanpa menghapus fitur lama:

1. Empat card laporan kini aktif dan bisa diklik:
   - Laporan Penjualan
   - Laporan Produksi
   - Laporan Stok
   - Laporan Transaksi

2. Setiap laporan punya:
   - summary card
   - tabel detail
   - tombol detail per baris
   - filter periode hari ini, minggu ini, bulan ini, tahun ini
   - loading overlay
   - toast info/success
   - modal detail
   - modal export

3. Export per laporan sudah aktif:
   - Excel (.xls) dengan header warna, ringkasan, tabel, border
   - PDF (.pdf) dengan header laporan, ringkasan, tabel, dan nomor halaman

4. Data masih dummy, tetapi struktur service sudah siap untuk backend:
   - GET /api/reports?period=week
   - GET /api/reports/:type?period=week

5. File baru:
   - src/types/reports.ts
   - src/data/mockReports.ts
   - src/services/report.service.ts
   - src/utils/reportExport.ts

6. File diubah:
   - src/pages/manager/Reports.tsx
   - src/pages/manager/Dashboard.tsx (menghapus duplikasi state actionLoading)
