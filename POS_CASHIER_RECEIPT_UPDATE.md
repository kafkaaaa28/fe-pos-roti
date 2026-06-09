# POS Kasir Receipt Update

Perubahan yang dilakukan pada `src/pages/cashier/POS.tsx`:

- Produk POS sekarang menggunakan data menu public dan foto WebP dari `src/assets/menu`.
- Ditambahkan search dan filter kategori menu: semua, shell, filling, dessert.
- Ditambahkan data customer: nama pemesan dan nomor HP/WhatsApp.
- Ditambahkan catatan pesanan di area keranjang.
- Tombol pembayaran sekarang membuka modal metode pembayaran.
- Metode pembayaran yang tersedia: Cash, QRIS, Transfer.
- Untuk Cash, kasir mengisi uang diterima dan sistem menghitung kembalian.
- Setelah pembayaran berhasil, muncul modal success dengan struk/bill rapi.
- Struk berisi nomor struk, tanggal, nama kasir, nama customer, nomor HP, daftar item, total, metode pembayaran, uang diterima, kembalian, dan catatan.
- Ditambahkan tombol Cetak Struk.
- Ditambahkan tombol Kirim WhatsApp menggunakan link `wa.me` dengan pesan struk yang sudah terisi.

Catatan integrasi backend:

- Saat backend aktif, alur pembayaran POS sebaiknya menggunakan endpoint `POST /api/pos` sesuai REST API Design.
- FE mengirim items, customerName, customerPhone, notes, paymentMethod, cashReceived.
- Backend membuat transaction, transaction_items, payment, mengurangi stok produk, lalu mengembalikan data receipt.
- Pengiriman WhatsApp otomatis penuh membutuhkan WhatsApp Business API di backend. Untuk FE dummy saat ini, sistem membuka WhatsApp dengan isi struk otomatis dan user tetap menekan tombol kirim.
