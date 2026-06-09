# Beard Papa's Responsive & Branding Update

Update ini memperbaiki tampilan dashboard Manager dan Staff pada tablet/mobile agar card tidak keluar layar. Elemen ringkasan di layar kecil dibuat dapat di-swipe horizontal, sedangkan tabel tetap memakai horizontal scroll.

Perubahan utama:
- Branding diganti menjadi Beard Papa's.
- Logo lokal WebP ditambahkan: `src/assets/brand/papa-bread-logo.webp` dan `src/assets/brand/papa-bread-wordmark.webp`.
- Palet warna disesuaikan dengan identitas Beard Papa's: navy, kuning, cream, dan aksen biru muda.
- Sidebar dan navbar public memakai logo Beard Papa's.
- Dashboard Manager dan Staff diberi responsive guard `.dashboard-shell`.
- Card summary dan filter periode mobile menggunakan `.mobile-swipe-row`.
- Grafik yang terlalu lebar dapat digeser horizontal di mobile.
- Struktur data dummy tetap dipertahankan agar integrasi backend tetap mudah.
