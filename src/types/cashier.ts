export type CashierPeriod = "today" | "week" | "month";

export type CashierOrderStatus = "PENDING" | "PAID" | "PROCESSING" | "READY" | "COMPLETED" | "CANCELLED";
export type CashierTransactionType = "OFFLINE" | "ONLINE";
export type CashierPaymentMethod = "Cash" | "QRIS" | "Bank Transfer" | "E-Wallet";
export type CashierStockStatus = "AMAN" | "MENIPIS" | "HABIS";

export interface CashierSummary {
  todayRevenue: number;
  todayTransactions: number;
  onlineOrders: number;
  readyOrders: number;
  pendingOrders: number;
  soldProducts: number;
}

export interface CashierTrend {
  value: number;
  label: string;
}

export interface CashierTransactionTrendPoint {
  label: string;
  revenue: number;
  transactions: number;
}

export interface CashierRecentTransaction {
  id: string;
  invoiceNumber: string;
  customerName: string;
  type: CashierTransactionType;
  paymentMethod: CashierPaymentMethod;
  status: CashierOrderStatus;
  totalPrice: number;
  createdAt: string;
}

export interface CashierOnlineOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: string;
  totalPrice: number;
  status: CashierOrderStatus;
  createdAt: string;
}

export interface CashierProductStock {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  status: CashierStockStatus;
}

export interface CashierPaymentBreakdown {
  method: CashierPaymentMethod;
  total: number;
  count: number;
  percentage: number;
}

export interface CashierDashboardData {
  generatedAt: string;
  period: CashierPeriod;
  summary: CashierSummary;
  trends: {
    todayRevenue: CashierTrend;
    todayTransactions: CashierTrend;
    onlineOrders: CashierTrend;
    readyOrders: CashierTrend;
  };
  transactionTrend: CashierTransactionTrendPoint[];
  recentTransactions: CashierRecentTransaction[];
  onlineOrders: CashierOnlineOrder[];
  stockWarnings: CashierProductStock[];
  paymentBreakdown: CashierPaymentBreakdown[];
}
