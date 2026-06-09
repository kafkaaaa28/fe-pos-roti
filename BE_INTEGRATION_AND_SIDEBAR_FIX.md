# BE Integration & Sidebar Fix

Perubahan terakhir:

1. Branding public/internal diganti menjadi **Beard Papa's**.
2. Role kasir diselaraskan dengan backend menjadi `KASIR`.
3. `VITE_API_URL` default diarahkan ke `http://localhost:5000` sesuai dokumentasi backend.
4. Auth service membaca response backend `{ user, tokens: { accessToken } }`.
5. Header `Authorization: Bearer <accessToken>` tetap otomatis dikirim oleh Axios interceptor.
6. Dashboard summary memakai endpoint backend `/dashboard/summary` dengan fallback ke dummy data jika backend belum aktif.
7. Manager product/material/recipe/production/stock movement/user list mulai diarahkan ke endpoint backend yang tersedia, tetap fallback dummy agar FE tidak blank.
8. Sidebar internal diperbaiki menjadi fixed mulai tablet/desktop (`md`) dan tidak ikut scroll halaman.
9. Mobile tetap menggunakan drawer/sidebar dari tombol menu.
