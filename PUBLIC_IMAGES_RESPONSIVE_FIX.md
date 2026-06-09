# Public Images + Mobile Navbar + Action Buttons Fix

Perubahan:

1. Tombol aksi tabel dibuat touch-friendly.
   - Minimal 44px, Android 48px.
   - Ikon dipaksa 18-20px agar terlihat jelas di HP.
   - Berlaku untuk tombol detail/edit/hapus/adjustment di tabel manager dan staff.

2. Halaman public Home dan Products sudah memakai gambar lokal WebP.
   - Aset berada di `src/assets/bakery/`.
   - Data produk public dipusatkan di `src/data/publicProducts.ts`.
   - Gambar dipreload memakai `src/utils/imageCache.ts` agar tidak terasa load ulang setiap pindah halaman.
   - Saat build Vite, file WebP diberi hashed filename sehingga browser/CDN lebih mudah melakukan cache.

3. Navbar public mobile diperbaiki.
   - Setelah klik Beranda/Produk/Tentang/Kontak, menu otomatis tertutup.
   - Menu juga otomatis tertutup ketika route berubah.
   - Tombol menu hanya tampil saat belum login karena customer/internal sudah punya navigasi sendiri.

4. Button umum diperbesar sedikit.
   - `Button` component sekarang inline-flex dan punya min-height.
   - Lebih nyaman diklik di layar sentuh.
