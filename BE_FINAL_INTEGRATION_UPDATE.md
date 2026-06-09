# BE Final Integration Update

Update ini menyesuaikan FE dengan dokumentasi API backend terbaru.

## Terintegrasi

- Auth terbaru: `/auth/login`, `/auth/register`, `/auth/me`, `PATCH /auth/me`.
- Header bearer token otomatis: `Authorization: Bearer <accessToken>`.
- Dashboard role: `/dashboard/manager`, `/dashboard/staff`, `/dashboard/kasir`, `/dashboard/customer` dengan fallback dummy.
- User Management Manager: `GET/POST/PATCH/DELETE /users`.
- Reports Manager: `/reports/sales`, `/reports/productions`, `/reports/inventory`, `/reports/transactions`.
- Activity Logs Manager: `/activity-logs`, `/activity-logs/:id`.
- POS offline: `POST /transactions/offline` dengan `orderType`, `tableNumber`, `customerName`, `customerPhone`, `notes`, `paymentMethod`, `cashReceived`, dan `referenceNumber`.
- Checkout online: `POST /transactions/checkout` dengan `orderType`, `tableNumber`, `notes`, customer detail, dan payment callbacks.
- Receipt: `/transactions/:id/receipt` sudah didukung pada service transaksi.
- Cart customer: `/cart`, `/cart/items`, update, delete, clear.
- Recipe/BOM grouped sync: UI tetap grouped per produk, backend tetap satu row `productId + materialId`; update/delete grouped sudah disinkronkan dengan kombinasi `POST/PATCH/DELETE /recipes`.

## Masih Catatan

- Export resmi file dari backend belum ada di dokumentasi; export masih dilakukan FE dari data report aktif.
- Staff page lama masih ada beberapa yang local-first, tetapi endpoint dasar sudah ada dan service manager/staff sudah siap dilanjutkan.
- WhatsApp otomatis tidak diintegrasikan karena memang tidak dibuat di backend.
