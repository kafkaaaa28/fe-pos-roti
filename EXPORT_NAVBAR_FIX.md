# Export dan Navbar Fix

Perubahan terbaru:

1. Dashboard Manager sekarang bisa export data dummy ke Excel (.xls) dan PDF (.pdf) langsung dari frontend.
2. Modal export memiliki pilihan format Excel atau PDF.
3. Setelah export, muncul loading, toast success, dan modal success.
4. Sidebar dashboard dibuat sticky sehingga tidak ikut hilang saat halaman di-scroll.
5. Navbar atas dibuat fixed dengan z-index lebih tinggi agar konten tidak menutup navbar saat scroll.
6. App main diberi posisi relatif dan padding-top agar konten tetap berada di bawah navbar.

File penting yang berubah:

- src/pages/manager/Dashboard.tsx
- src/utils/dashboardExport.ts
- src/components/layout/Sidebar.tsx
- src/components/layout/Navbar.tsx
- src/App.tsx

Build test:

```bash
npm run build
```

Hasil: berhasil.
