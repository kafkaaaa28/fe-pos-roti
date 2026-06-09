import type { DashboardData, DashboardPeriod } from "../types/dashboard";

const now = "2026-06-07T13:30:00.000Z";

const baseDashboard: DashboardData = {
  summary: {
    totalSales: 4250000,
    totalProduction: 340,
    totalSoldProducts: 286,
    transactionCount: 32,
    customerCount: 142,
    bestSellingProduct: "Roti Coklat",
    monthlyRevenue: 18500000,
    lowStockCount: 5,
  },
  trends: {
    totalSales: { value: 12, label: "dibanding periode lalu" },
    totalProduction: { value: 5, label: "lebih tinggi" },
    totalSoldProducts: { value: 9, label: "item terjual naik" },
    transactionCount: { value: -3, label: "sedikit turun" },
  },
  salesChart: [
    { label: "Sen", sales: 550000, transactions: 8 },
    { label: "Sel", sales: 720000, transactions: 11 },
    { label: "Rab", sales: 610000, transactions: 9 },
    { label: "Kam", sales: 830000, transactions: 13 },
    { label: "Jum", sales: 760000, transactions: 12 },
    { label: "Sab", sales: 980000, transactions: 16 },
    { label: "Min", sales: 425000, transactions: 7 },
  ],
  productionChart: [
    { label: "Roti Coklat", quantity: 92 },
    { label: "Roti Keju", quantity: 70 },
    { label: "Roti Tawar", quantity: 58 },
    { label: "Donat", quantity: 64 },
    { label: "Croissant", quantity: 56 },
  ],
  bestSellingProducts: [
    { id: "PRD-001", name: "Roti Coklat", sold: 86, revenue: 860000, percentage: 100 },
    { id: "PRD-002", name: "Roti Keju", sold: 64, revenue: 768000, percentage: 74 },
    { id: "PRD-003", name: "Donat Gula", sold: 52, revenue: 416000, percentage: 60 },
    { id: "PRD-004", name: "Roti Tawar", sold: 44, revenue: 660000, percentage: 51 },
  ],
  lowStocks: [
    { id: "MAT-001", name: "Tepung Terigu", type: "Bahan Baku", stock: 2, minStock: 5, unit: "Kg", status: "MENIPIS" },
    { id: "MAT-002", name: "Mentega", type: "Bahan Baku", stock: 0.5, minStock: 1, unit: "Kg", status: "MENIPIS" },
    { id: "MAT-003", name: "Gula Pasir", type: "Bahan Baku", stock: 1.5, minStock: 3, unit: "Kg", status: "MENIPIS" },
    { id: "PRD-005", name: "Roti Sosis", type: "Produk Jadi", stock: 0, minStock: 8, unit: "pcs", status: "HABIS" },
    { id: "PRD-006", name: "Roti Abon", type: "Produk Jadi", stock: 7, minStock: 10, unit: "pcs", status: "MENIPIS" },
  ],
  recentTransactions: [
    { id: "TRX-001", invoiceNumber: "INV-20260607-001", customerName: "Walk-in Customer", type: "OFFLINE", status: "COMPLETED", totalPrice: 85000, createdAt: "2026-06-07T09:05:00.000Z" },
    { id: "TRX-002", invoiceNumber: "INV-20260607-002", customerName: "Nadia", type: "ONLINE", status: "READY", totalPrice: 126000, createdAt: "2026-06-07T09:40:00.000Z" },
    { id: "TRX-003", invoiceNumber: "INV-20260607-003", customerName: "Rama", type: "ONLINE", status: "PROCESSING", totalPrice: 95000, createdAt: "2026-06-07T10:20:00.000Z" },
    { id: "TRX-004", invoiceNumber: "INV-20260607-004", customerName: "Walk-in Customer", type: "OFFLINE", status: "COMPLETED", totalPrice: 57000, createdAt: "2026-06-07T11:15:00.000Z" },
    { id: "TRX-005", invoiceNumber: "INV-20260607-005", customerName: "Dewi", type: "ONLINE", status: "PAID", totalPrice: 112000, createdAt: "2026-06-07T12:02:00.000Z" },
  ],
  recentProductions: [
    { id: "PRDCT-001", productName: "Roti Coklat", quantity: 50, userName: "Staff Produksi", status: "Selesai", createdAt: "2026-06-07T07:30:00.000Z" },
    { id: "PRDCT-002", productName: "Roti Keju", quantity: 40, userName: "Staff Produksi", status: "Selesai", createdAt: "2026-06-07T08:15:00.000Z" },
    { id: "PRDCT-003", productName: "Donat Gula", quantity: 60, userName: "Staff Produksi", status: "Diproses", createdAt: "2026-06-07T10:00:00.000Z" },
    { id: "PRDCT-004", productName: "Roti Tawar", quantity: 30, userName: "Staff Produksi", status: "Tertunda", createdAt: "2026-06-07T12:30:00.000Z" },
  ],
  generatedAt: now,
};

const cloneWithScale = (scale: number, period: DashboardPeriod): DashboardData => ({
  ...baseDashboard,
  summary: {
    ...baseDashboard.summary,
    totalSales: Math.round(baseDashboard.summary.totalSales * scale),
    totalProduction: Math.round(baseDashboard.summary.totalProduction * scale),
    totalSoldProducts: Math.round(baseDashboard.summary.totalSoldProducts * scale),
    transactionCount: Math.max(1, Math.round(baseDashboard.summary.transactionCount * scale)),
    monthlyRevenue: period === "month" ? baseDashboard.summary.monthlyRevenue : Math.round(baseDashboard.summary.monthlyRevenue * scale),
  },
  salesChart: baseDashboard.salesChart.map((item) => ({
    ...item,
    sales: Math.round(item.sales * scale),
    transactions: Math.max(1, Math.round(item.transactions * scale)),
  })),
  productionChart: baseDashboard.productionChart.map((item) => ({
    ...item,
    quantity: Math.max(1, Math.round(item.quantity * scale)),
  })),
  generatedAt: now,
});

export const mockDashboardByPeriod: Record<DashboardPeriod, DashboardData> = {
  today: cloneWithScale(0.72, "today"),
  week: baseDashboard,
  month: cloneWithScale(3.85, "month"),
  year: cloneWithScale(24.6, "year"),
};
