# Update Integrasi FE dengan Dokumentasi BE Terbaru

## Sudah Diintegrasikan

1. Auth mengikuti kontrak backend:
   - `POST /auth/login`
   - `POST /auth/register`
   - `GET /auth/me`
   - `PATCH /auth/me`
   - Token dikirim via `Authorization: Bearer <accessToken>`.

2. Role sudah mengikuti backend:
   - `MANAGER`
   - `STAFF`
   - `KASIR`
   - `CUSTOMER`

3. Dashboard role sudah diarahkan ke endpoint baru:
   - Manager: `GET /dashboard/manager`
   - Staff: `GET /dashboard/staff`
   - Kasir: `GET /dashboard/kasir`

4. Produk katalog dan POS sudah mencoba mengambil data dari backend:
   - `GET /products?limit=100&status=ACTIVE`
   - Jika backend belum aktif, FE tetap memakai dummy menu lokal.

5. Cart customer sudah mencoba sinkron ke backend:
   - `GET /cart`
   - `POST /cart/items`
   - `PATCH /cart/items/:itemId`
   - `DELETE /cart/items/:itemId`
   - `DELETE /cart`
   - Jika backend belum aktif, FE tetap memakai localStorage.

6. Checkout customer sudah diarahkan ke backend:
   - `POST /transactions/checkout`
   - Mengirim `orderType`, `tableNumber`, `notes`, `customer`, dan `enabledPayments`.
   - `queueNumber` dan `receipt` mengikuti response backend.

7. Pesanan online kasir sudah diarahkan ke backend:
   - `GET /transactions?type=ONLINE`
   - `PATCH /transactions/:id/status`
   - Jika backend belum aktif, FE tetap memakai fallback localStorage.

8. Tracking customer sudah diarahkan ke backend:
   - `GET /transactions/me`
   - Jika backend belum aktif, FE tetap memakai fallback localStorage.

9. POS offline sudah diarahkan ke backend:
   - `POST /transactions/offline`
   - Mengirim `items`, `customerName`, `customerPhone`, `orderType`, `notes`, `paymentMethod`, `cashReceived`, dan `referenceNumber`.
   - Backend menghitung `changeAmount` dan membuat `receipt`.

10. Manager master data sebagian sudah diarahkan ke backend:
   - Products: `GET/POST/PATCH/DELETE /products`
   - Materials: `GET/POST/PATCH/DELETE /materials`
   - Recipes: `GET /recipes`, `POST /recipes` untuk line BOM
   - Productions: `GET /productions`
   - Stock Movements: `GET /stock-movements`, `POST /stock-movements` untuk material
   - Users: `GET /users`

## Masih Perlu Dipastikan / Belum Penuh

1. User Management create/update/delete masih fallback lokal karena dokumentasi terbaru hanya mencantumkan `GET /users` dan `GET /users/:id`.
2. Report endpoint khusus belum ada di dokumentasi terbaru. Halaman laporan FE masih memakai fallback/dummy dan export FE.
3. Activity Logs belum ada endpoint di dokumentasi terbaru.
4. Recipe/BOM di UI berbentuk satu produk dengan banyak material, sedangkan backend menyimpan satu row per `productId + materialId`; create sudah dicoba per line, tetapi update/delete BOM grouped masih fallback lokal.
5. Staff page lama seperti Materials/Productions masih ada yang bersifat lokal di UI, walaupun dashboard dan manager services sudah disiapkan. Integrasi penuh staff CRUD bisa dilanjutkan setelah prioritas customer/POS stabil.
6. POS Dine In di UI POS offline belum dibuat eksplisit. Saat ini POS offline mengirim `orderType: TAKE_AWAY`; checkout customer sudah mendukung `DINE_IN` dan `TAKE_AWAY`.
7. Export laporan dari backend belum ada; saat ini export dilakukan di FE dari data aktif.

## Catatan

WA otomatis tidak dimasukkan sebagai gap karena memang tidak dibangun pada backend saat ini.
