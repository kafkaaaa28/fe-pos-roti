# Manager Role Ready Update

Update ini merapikan role Manager agar lebih mudah diintegrasikan dengan backend Express + Prisma sesuai blueprint Sistem Informasi Produksi, Inventory, POS, dan Pemesanan Online Toko Roti.

## Prinsip akses Manager

Manager difokuskan untuk:

- Dashboard monitoring
- Laporan dan export
- Monitoring produksi
- Monitoring inventory
- Audit stock movement
- Kelola user internal
- Kelola master data yang tersedia di halaman manager, seperti produk, bahan baku, dan recipe/BOM

Dashboard tetap tidak menjadi halaman CRUD langsung. CRUD ditempatkan di halaman modul masing-masing agar alur tidak campur.

## File baru / penting

- `src/types/manager.ts`
- `src/data/mockManager.ts`
- `src/services/manager.service.ts`
- `src/components/manager/ManagerPageShell.tsx`
- `src/components/manager/ManagerCrudTable.tsx`
- `src/components/manager/ManagerBadges.tsx`
- `src/pages/manager/StockMovements.tsx`

## Halaman Manager yang dirapikan

- `Dashboard.tsx`
- `Products.tsx`
- `Materials.tsx`
- `Recipes.tsx`
- `Productions.tsx`
- `Inventory.tsx`
- `StockMovements.tsx`
- `Users.tsx`

## Endpoint backend yang nanti tinggal disambungkan

- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `GET /api/materials`
- `POST /api/materials`
- `PUT /api/materials/:id`
- `DELETE /api/materials/:id`
- `GET /api/recipes`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`
- `GET /api/productions`
- `GET /api/inventory`
- `POST /api/inventory/adjustment`
- `GET /api/stock-movements`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

## Catatan

Data masih dummy, tetapi sekarang dummy dipusatkan di `mockManager.ts` dan dipanggil lewat `manager.service.ts`. Saat backend sudah jadi, file yang paling banyak diganti hanya service, bukan UI halaman.

Build sudah dites dengan `npm run build` dan berhasil.
