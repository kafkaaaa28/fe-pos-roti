# Update Export Dashboard Manager

Perubahan ini hanya menambahkan dan merapikan fitur export dashboard. Fitur lama tetap dipertahankan.

## Excel
- Export Excel tetap berjalan dari data dummy frontend.
- File dibuat dalam format `.xls` berbasis XML Spreadsheet agar bisa dibuka di Excel.
- Data dipisahkan per sheet:
  1. Ringkasan
  2. Penjualan
  3. Produksi
  4. Produk Terlaris
  5. Stok Menipis
  6. Transaksi
- Header tabel diberi warna.
- Tabel diberi border.
- Nilai rupiah dan angka dibuat lebih rapi.
- Kolom diberi lebar khusus agar mudah dibaca.

## PDF
- Export PDF tetap berjalan dari data dummy frontend.
- Layout dibuat seperti laporan resmi.
- Ada header laporan, periode, tanggal export, tabel berwarna, dan nomor halaman.
- Bagian laporan dipisahkan menjadi ringkasan, penjualan, produksi, produk terlaris, stok menipis, transaksi terbaru, dan produksi terbaru.

## UI Modal Export
- Deskripsi modal export diperbarui.
- Opsi Excel menjelaskan export multi-sheet.
- Opsi PDF menjelaskan export bertabel.
- Success modal tetap dipakai.
