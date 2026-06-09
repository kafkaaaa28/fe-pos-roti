# Customer Dashboard Flow Update

Perubahan utama:
- Customer setelah login tidak lagi menggunakan navbar/top public, tetapi memakai sidebar/drawer seperti role Manager, Staff, dan Kasir.
- Halaman public seperti Beranda, Produk, Tentang, dan Kontak diarahkan ke dashboard role jika user sudah login.
- Dashboard Customer sekarang menjadi halaman pesan menu: daftar menu, search, filter kategori, add to cart via bottom sheet kecil.
- Setelah klik Tambah, muncul bottom sheet berisi produk, quantity, harga, total, tombol Batal dan Selesaikan Pesanan.
- Tombol Selesaikan Pesanan menambahkan item ke keranjang. User lanjut ke tab Keranjang untuk memilih Checkout atau Pilih Menu Lagi.
- Checkout tetap berisi nama, nomor HP, dine in/take away, nomor meja jika dine in, catatan, dan metode pembayaran.
- Saat checkout dibuat, sistem menghasilkan nomor antrian dummy dan status masuk ke pesanan online kasir.
- Tracking customer menampilkan nomor antrian, nama, status, tipe pesanan, meja jika dine in, daftar item, total, dan progress step.
- Pesanan Online Kasir tetap menjadi pihak yang mengubah status: PENDING → PAID → PROCESSING → READY → COMPLETED.
