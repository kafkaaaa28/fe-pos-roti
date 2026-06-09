# Customer & Cashier Mobile/Form Fix

Perubahan fokus pada bug UI dan UX:

1. Customer mobile add menu
   - Tambah menu tidak lagi terkunci pada satu produk.
   - Setelah klik Tambah, produk langsung masuk ke keranjang ringkas.
   - Keranjang ringkas menampilkan daftar item, quantity, subtotal, total, plus/minus, hapus, pilih menu lagi, dan selesaikan pesanan.
   - Customer tetap bisa memilih menu lain tanpa harus menutup proses pesanan.

2. Z-index customer mobile
   - Bottom cart sheet dibuat lebih rendah dari drawer/sidebar mobile.
   - Saat menu navbar dibuka, drawer berada di atas cart sheet, bukan tertutup modal.

3. Cashier POS input form
   - Komponen CartPanel dipindah keluar dari komponen POS utama.
   - Input Nama Kasir, Nama Pemesan, No HP, Nomor Meja, dan Catatan tidak lagi kehilangan fokus setiap satu huruf.
   - Keyboard mobile tidak otomatis tertutup saat mengetik.

4. Build
   - npm run build berhasil.
