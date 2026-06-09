# Cashier POS Cart Fixed Update

Perbaikan ini hanya menyentuh layout POS kasir.

## Perubahan
- Layout POS dibuat `h-dvh overflow-hidden` agar halaman tidak ikut scroll secara global.
- Area daftar menu di sisi kiri dibuat sebagai satu-satunya area scroll utama pada desktop.
- Panel cart di sisi kanan dibuat fixed-height seperti sidebar/navbar sehingga tetap diam di tempat.
- Cart desktop tidak lagi ikut turun saat menu discroll.
- Mobile tetap memakai floating cart icon dan modal cart seperti sebelumnya.

## Tujuan UX
Kasir bisa terus melihat total, data customer, dan tombol bayar di kanan, sementara yang discroll hanya daftar menu di sebelah kiri.
