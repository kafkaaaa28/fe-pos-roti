import type { CashierDashboardData, CashierPeriod } from "../types/cashier";

const baseData: CashierDashboardData = {
  generatedAt: new Date().toISOString(),
  period: "today",
  summary: {
    todayRevenue: 1585000,
    todayTransactions: 42,
    onlineOrders: 9,
    readyOrders: 4,
    pendingOrders: 3,
    soldProducts: 118,
  },
  trends: {
    todayRevenue: { value: 14, label: "Naik dari shift kemarin" },
    todayTransactions: { value: 8, label: "Transaksi POS lebih ramai" },
    onlineOrders: { value: 11, label: "Order online bertambah" },
    readyOrders: { value: 6, label: "Siap diambil customer" },
  },
  transactionTrend: [
    { label: "08", revenue: 125000, transactions: 4 },
    { label: "10", revenue: 285000, transactions: 8 },
    { label: "12", revenue: 410000, transactions: 11 },
    { label: "14", revenue: 255000, transactions: 7 },
    { label: "16", revenue: 330000, transactions: 9 },
    { label: "18", revenue: 180000, transactions: 3 },
  ],
  recentTransactions: [
    { id: "TRX-001", invoiceNumber: "INV-POS-2401", customerName: "Walk-in Customer", type: "OFFLINE", paymentMethod: "Cash", status: "COMPLETED", totalPrice: 96000, createdAt: new Date().toISOString() },
    { id: "TRX-002", invoiceNumber: "INV-POS-2402", customerName: "Walk-in Customer", type: "OFFLINE", paymentMethod: "QRIS", status: "COMPLETED", totalPrice: 128000, createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString() },
    { id: "TRX-003", invoiceNumber: "INV-ONL-0921", customerName: "Rina", type: "ONLINE", paymentMethod: "E-Wallet", status: "PAID", totalPrice: 84000, createdAt: new Date(Date.now() - 1000 * 60 * 34).toISOString() },
    { id: "TRX-004", invoiceNumber: "INV-POS-2403", customerName: "Walk-in Customer", type: "OFFLINE", paymentMethod: "Bank Transfer", status: "COMPLETED", totalPrice: 62000, createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString() },
  ],
  onlineOrders: [
    { id: "ORD-001", orderNumber: "ORD-0921", customerName: "Rina", items: "2x Original Cream Puff, 1x Green Tea Eclair", totalPrice: 84000, status: "PAID", createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
    { id: "ORD-002", orderNumber: "ORD-0922", customerName: "Dani", items: "1x Chocolate Eclair", totalPrice: 28000, status: "PROCESSING", createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString() },
    { id: "ORD-003", orderNumber: "ORD-0923", customerName: "Maya", items: "3x Vanilla Filled Eclair", totalPrice: 96000, status: "READY", createdAt: new Date(Date.now() - 1000 * 60 * 36).toISOString() },
    { id: "ORD-004", orderNumber: "ORD-0924", customerName: "Hendra", items: "1x Japanese Cheesecake", totalPrice: 42000, status: "PENDING", createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString() },
  ],
  stockWarnings: [
    { id: "PRD-001", name: "Original Cream Puff", stock: 8, minStock: 12, status: "MENIPIS" },
    { id: "PRD-002", name: "Chocolate Eclair", stock: 5, minStock: 10, status: "MENIPIS" },
    { id: "PRD-003", name: "Ube Eclair", stock: 0, minStock: 6, status: "HABIS" },
  ],
  paymentBreakdown: [
    { method: "QRIS", total: 685000, count: 18, percentage: 43 },
    { method: "Cash", total: 420000, count: 12, percentage: 27 },
    { method: "E-Wallet", total: 315000, count: 8, percentage: 20 },
    { method: "Bank Transfer", total: 165000, count: 4, percentage: 10 },
  ],
};

export function getMockCashierDashboard(period: CashierPeriod): CashierDashboardData {
  const multiplier = period === "today" ? 1 : period === "week" ? 5.8 : 21;

  return {
    ...baseData,
    generatedAt: new Date().toISOString(),
    period,
    summary: {
      todayRevenue: Math.round(baseData.summary.todayRevenue * multiplier),
      todayTransactions: Math.round(baseData.summary.todayTransactions * multiplier),
      onlineOrders: Math.round(baseData.summary.onlineOrders * multiplier),
      readyOrders: Math.max(1, Math.round(baseData.summary.readyOrders * (period === "today" ? 1 : 1.8))),
      pendingOrders: Math.max(1, Math.round(baseData.summary.pendingOrders * (period === "today" ? 1 : 1.4))),
      soldProducts: Math.round(baseData.summary.soldProducts * multiplier),
    },
    transactionTrend: baseData.transactionTrend.map((item) => ({
      ...item,
      revenue: Math.round(item.revenue * multiplier),
      transactions: Math.round(item.transactions * (period === "today" ? 1 : period === "week" ? 2.1 : 4.4)),
    })),
    paymentBreakdown: baseData.paymentBreakdown.map((item) => ({
      ...item,
      total: Math.round(item.total * multiplier),
      count: Math.round(item.count * (period === "today" ? 1 : period === "week" ? 2 : 4)),
    })),
  };
}
