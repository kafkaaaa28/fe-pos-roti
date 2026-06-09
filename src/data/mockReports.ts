import type { DashboardPeriod } from "../types/dashboard";
import type { ManagerReportsData, ReportMeta, ReportType } from "../types/reports";
import { formatNumber, formatRupiah } from "../utils/formatter";

const generatedAt = "2026-06-07T13:45:00.000Z";

export const reportMetas: ReportMeta[] = [
  {
    type: "sales",
    title: "Laporan Penjualan",
    shortTitle: "Penjualan",
    description: "Rekap omzet, item terjual, dan transaksi POS maupun online.",
    endpoint: "GET /api/reports/sales",
  },
  {
    type: "production",
    title: "Laporan Produksi",
    shortTitle: "Produksi",
    description: "Rekap produk yang dibuat, jumlah produksi, dan petugas produksi.",
    endpoint: "GET /api/reports/productions",
  },
  {
    type: "stock",
    title: "Laporan Stok",
    shortTitle: "Stok",
    description: "Monitoring stok bahan baku dan produk jadi, termasuk status menipis/habis.",
    endpoint: "GET /api/reports/inventory",
  },
  {
    type: "transaction",
    title: "Laporan Transaksi",
    shortTitle: "Transaksi",
    description: "Riwayat transaksi offline dan online beserta status pembayaran/pesanan.",
    endpoint: "GET /api/reports/transactions",
  },
];

const baseSales = [
  { id: "SAL-001", date: "2026-06-07T09:05:00.000Z", invoiceNumber: "INV-20260607-001", customerName: "Walk-in Customer", type: "OFFLINE" as const, productCount: 3, totalQty: 8, totalPrice: 85000, status: "COMPLETED" as const },
  { id: "SAL-002", date: "2026-06-07T09:40:00.000Z", invoiceNumber: "INV-20260607-002", customerName: "Nadia", type: "ONLINE" as const, productCount: 4, totalQty: 12, totalPrice: 126000, status: "READY" as const },
  { id: "SAL-003", date: "2026-06-07T10:20:00.000Z", invoiceNumber: "INV-20260607-003", customerName: "Rama", type: "ONLINE" as const, productCount: 2, totalQty: 7, totalPrice: 95000, status: "PROCESSING" as const },
  { id: "SAL-004", date: "2026-06-07T11:15:00.000Z", invoiceNumber: "INV-20260607-004", customerName: "Walk-in Customer", type: "OFFLINE" as const, productCount: 2, totalQty: 5, totalPrice: 57000, status: "COMPLETED" as const },
  { id: "SAL-005", date: "2026-06-07T12:02:00.000Z", invoiceNumber: "INV-20260607-005", customerName: "Dewi", type: "ONLINE" as const, productCount: 5, totalQty: 10, totalPrice: 112000, status: "PAID" as const },
];

const baseProduction = [
  { id: "PRO-001", date: "2026-06-07T07:30:00.000Z", productionNumber: "PRDCT-20260607-001", productName: "Roti Coklat", quantity: 50, staffName: "Staff Produksi", status: "Selesai" as const, notes: "Batch pagi selesai tanpa kendala." },
  { id: "PRO-002", date: "2026-06-07T08:15:00.000Z", productionNumber: "PRDCT-20260607-002", productName: "Roti Keju", quantity: 40, staffName: "Staff Produksi", status: "Selesai" as const, notes: "Menggunakan resep standar." },
  { id: "PRO-003", date: "2026-06-07T10:00:00.000Z", productionNumber: "PRDCT-20260607-003", productName: "Donat Gula", quantity: 60, staffName: "Staff Produksi", status: "Diproses" as const, notes: "Menunggu proses topping." },
  { id: "PRO-004", date: "2026-06-07T12:30:00.000Z", productionNumber: "PRDCT-20260607-004", productName: "Roti Tawar", quantity: 30, staffName: "Staff Produksi", status: "Tertunda" as const, notes: "Bahan baku perlu dicek ulang." },
];

const baseStock = [
  { id: "MAT-001", name: "Tepung Terigu", type: "Bahan Baku" as const, stock: 2, minStock: 5, unit: "Kg", status: "MENIPIS" as const, lastMovement: "Produksi Roti Coklat -5 Kg" },
  { id: "MAT-002", name: "Mentega", type: "Bahan Baku" as const, stock: 0.5, minStock: 1, unit: "Kg", status: "MENIPIS" as const, lastMovement: "Produksi Roti Keju -1 Kg" },
  { id: "MAT-003", name: "Gula Pasir", type: "Bahan Baku" as const, stock: 1.5, minStock: 3, unit: "Kg", status: "MENIPIS" as const, lastMovement: "Produksi Donat -2 Kg" },
  { id: "PRD-005", name: "Roti Sosis", type: "Produk Jadi" as const, stock: 0, minStock: 8, unit: "pcs", status: "HABIS" as const, lastMovement: "Penjualan POS -8 pcs" },
  { id: "PRD-006", name: "Roti Abon", type: "Produk Jadi" as const, stock: 7, minStock: 10, unit: "pcs", status: "MENIPIS" as const, lastMovement: "Penjualan Online -4 pcs" },
  { id: "PRD-001", name: "Roti Coklat", type: "Produk Jadi" as const, stock: 34, minStock: 15, unit: "pcs", status: "AMAN" as const, lastMovement: "Produksi +50 pcs" },
];

const baseTransactions = [
  { id: "TRX-001", date: "2026-06-07T09:05:00.000Z", invoiceNumber: "INV-20260607-001", customerName: "Walk-in Customer", type: "OFFLINE" as const, paymentMethod: "Cash" as const, totalPrice: 85000, status: "COMPLETED" as const },
  { id: "TRX-002", date: "2026-06-07T09:40:00.000Z", invoiceNumber: "INV-20260607-002", customerName: "Nadia", type: "ONLINE" as const, paymentMethod: "QRIS" as const, totalPrice: 126000, status: "READY" as const },
  { id: "TRX-003", date: "2026-06-07T10:20:00.000Z", invoiceNumber: "INV-20260607-003", customerName: "Rama", type: "ONLINE" as const, paymentMethod: "Bank Transfer" as const, totalPrice: 95000, status: "PROCESSING" as const },
  { id: "TRX-004", date: "2026-06-07T11:15:00.000Z", invoiceNumber: "INV-20260607-004", customerName: "Walk-in Customer", type: "OFFLINE" as const, paymentMethod: "Cash" as const, totalPrice: 57000, status: "COMPLETED" as const },
  { id: "TRX-005", date: "2026-06-07T12:02:00.000Z", invoiceNumber: "INV-20260607-005", customerName: "Dewi", type: "ONLINE" as const, paymentMethod: "E-Wallet" as const, totalPrice: 112000, status: "PAID" as const },
];

const scaleRows = (period: DashboardPeriod) => {
  const scale = period === "today" ? 0.75 : period === "week" ? 1 : period === "month" ? 3.7 : 22;
  return {
    sales: baseSales.map((item, index) => ({
      ...item,
      id: `${item.id}-${period}`,
      totalQty: Math.max(1, Math.round(item.totalQty * scale)),
      totalPrice: Math.round(item.totalPrice * scale),
      productCount: Math.max(1, Math.round(item.productCount * Math.min(scale, 2))),
      invoiceNumber: item.invoiceNumber.replace("20260607", period === "year" ? "2026" : period === "month" ? "202606" : "20260607") + (period === "today" ? "" : `-${index + 1}`),
    })),
    production: baseProduction.map((item) => ({
      ...item,
      id: `${item.id}-${period}`,
      quantity: Math.max(1, Math.round(item.quantity * scale)),
      productionNumber: item.productionNumber.replace("20260607", period === "year" ? "2026" : period === "month" ? "202606" : "20260607"),
    })),
    stock: baseStock,
    transaction: baseTransactions.map((item, index) => ({
      ...item,
      id: `${item.id}-${period}`,
      totalPrice: Math.round(item.totalPrice * scale),
      invoiceNumber: item.invoiceNumber.replace("20260607", period === "year" ? "2026" : period === "month" ? "202606" : "20260607") + (period === "today" ? "" : `-${index + 1}`),
    })),
  };
};

const makeReport = (period: DashboardPeriod): ManagerReportsData => {
  const rows = scaleRows(period);
  const totalSales = rows.sales.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQty = rows.sales.reduce((sum, item) => sum + item.totalQty, 0);
  const totalProduction = rows.production.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = rows.stock.filter((item) => item.status !== "AMAN").length;
  const transactionRevenue = rows.transaction.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    generatedAt,
    summaries: {
      sales: [
        { label: "Total Penjualan", value: formatRupiah(totalSales), helper: "Akumulasi omzet sesuai periode" },
        { label: "Produk Terjual", value: `${formatNumber(totalQty)} item`, helper: "Jumlah item dari transaksi" },
        { label: "Jumlah Invoice", value: rows.sales.length, helper: "Transaksi tercatat" },
        { label: "Rata-rata Transaksi", value: formatRupiah(Math.round(totalSales / Math.max(1, rows.sales.length))), helper: "Omzet rata-rata per invoice" },
      ],
      production: [
        { label: "Total Produksi", value: `${formatNumber(totalProduction)} pcs`, helper: "Akumulasi produksi" },
        { label: "Batch Produksi", value: rows.production.length, helper: "Jumlah batch tercatat" },
        { label: "Selesai", value: rows.production.filter((item) => item.status === "Selesai").length, helper: "Batch selesai" },
        { label: "Perlu Dicek", value: rows.production.filter((item) => item.status !== "Selesai").length, helper: "Diproses/tertunda" },
      ],
      stock: [
        { label: "Total Item", value: rows.stock.length, helper: "Produk dan bahan" },
        { label: "Stok Aman", value: rows.stock.filter((item) => item.status === "AMAN").length, helper: "Di atas minimum" },
        { label: "Stok Menipis", value: lowStockCount, helper: "Perlu restock" },
        { label: "Stok Habis", value: rows.stock.filter((item) => item.status === "HABIS").length, helper: "Harus segera ditangani" },
      ],
      transaction: [
        { label: "Total Transaksi", value: rows.transaction.length, helper: "POS dan online" },
        { label: "Nominal Transaksi", value: formatRupiah(transactionRevenue), helper: "Total nominal" },
        { label: "Online", value: rows.transaction.filter((item) => item.type === "ONLINE").length, helper: "Pesanan website" },
        { label: "Offline", value: rows.transaction.filter((item) => item.type === "OFFLINE").length, helper: "Transaksi POS" },
      ],
    },
    sales: rows.sales,
    production: rows.production,
    stock: rows.stock,
    transaction: rows.transaction,
  };
};

export const mockReportsByPeriod: Record<DashboardPeriod, ManagerReportsData> = {
  today: makeReport("today"),
  week: makeReport("week"),
  month: makeReport("month"),
  year: makeReport("year"),
};

export const getReportMeta = (type: ReportType) => reportMetas.find((item) => item.type === type) ?? reportMetas[0];
