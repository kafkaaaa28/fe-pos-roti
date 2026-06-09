# Staff Dashboard Update

Perubahan ini merapikan Dashboard Staff agar konsisten dengan tema POS Roti dan sesuai tupoksi Staff pada blueprint PDF.

## Fokus Role Staff
- Kelola Bahan Baku
- Produksi Roti
- Inventory
- Stock Movement
- Recipe/BOM
- Riwayat Produksi

## File Baru
- `src/types/staff.ts`
- `src/data/mockStaff.ts`
- `src/services/staff.service.ts`

## File Direvisi
- `src/pages/staff/Dashboard.tsx`

## Endpoint Siap Backend
- `GET /api/staff/dashboard?period=today|week|month`

Untuk saat ini data masih dummy. Jika backend sudah tersedia, cukup sesuaikan response endpoint dengan struktur `StaffDashboardData`.
