# Manager Access Revision

Revisi ini menegaskan pembagian akses manager:

- Dashboard Manager hanya untuk monitoring, detail cepat, export, refresh, filter, dan navigasi.
- Dashboard tidak menjalankan create/update/delete langsung.
- CRUD tetap berada pada halaman modul masing-masing, seperti Produk, Bahan Baku, Resep, Inventory, dan User.
- Produksi untuk manager dibuat sebagai monitoring/riwayat saja.
- Produksi baru tetap berada di role Staff; nama petugas otomatis mengikuti user login.

Dasar rancangan mengikuti blueprint: manager memantau dashboard, laporan, produksi, penjualan, inventory, stok menipis, transaksi, serta mengelola user.
