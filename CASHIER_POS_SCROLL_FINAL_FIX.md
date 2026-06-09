# Cashier POS Scroll Final Fix

Perubahan terakhir khusus halaman `/cashier/pos`:

1. Search POS dibuat satu baris penuh agar tidak menyempit pada zoom 100%.
2. Filter kategori menu dipindah ke baris terpisah dan tetap bisa digeser horizontal.
3. Layout desktop POS dibuat dua area scroll independen:
   - area daftar menu di kiri bisa discroll sendiri;
   - area keranjang POS di kanan bisa discroll sendiri.
4. Panel keranjang desktop dibuat fixed di sisi kanan, lebih ramping, dan tidak ikut turun saat daftar menu discroll.
5. Form keranjang diringkas agar pas pada layar desktop normal 100%.
6. Mobile tetap memakai floating cart icon.

Build sudah berhasil menggunakan `npm run build`.
