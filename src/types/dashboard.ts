export type DashboardPeriod = "today" | "week" | "month" | "year";

export type StockStatus = "AMAN" | "MENIPIS" | "HABIS";
export type TransactionStatus = "PENDING" | "PAID" | "PROCESSING" | "READY" | "COMPLETED" | "CANCELLED";
export type TransactionType = "OFFLINE" | "ONLINE";
export type ProductionStatus = "Selesai" | "Diproses" | "Tertunda";

export interface DashboardSummary {
  totalSales: number;
  totalProduction: number;
  totalSoldProducts: number;
  transactionCount: number;
  customerCount: number;
  bestSellingProduct: string;
  monthlyRevenue: number;
  lowStockCount: number;
}

export interface DashboardMetricTrend {
  value: number;
  label: string;
}

export interface DashboardChartPoint {
  label: string;
  sales: number;
  transactions: number;
}

export interface ProductionChartPoint {
  label: string;
  quantity: number;
}

export interface BestSellingProduct {
  id: string;
  name: string;
  sold: number;
  revenue: number;
  percentage: number;
}

export interface LowStockItem {
  id: string;
  name: string;
  type: "Bahan Baku" | "Produk Jadi";
  stock: number;
  minStock: number;
  unit: string;
  status: StockStatus;
}

export interface RecentTransaction {
  id: string;
  invoiceNumber: string;
  customerName: string;
  type: TransactionType;
  status: TransactionStatus;
  totalPrice: number;
  createdAt: string;
}

export interface RecentProduction {
  id: string;
  productName: string;
  quantity: number;
  userName: string;
  status: ProductionStatus;
  createdAt: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  trends: {
    totalSales: DashboardMetricTrend;
    totalProduction: DashboardMetricTrend;
    totalSoldProducts: DashboardMetricTrend;
    transactionCount: DashboardMetricTrend;
  };
  salesChart: DashboardChartPoint[];
  productionChart: ProductionChartPoint[];
  bestSellingProducts: BestSellingProduct[];
  lowStocks: LowStockItem[];
  recentTransactions: RecentTransaction[];
  recentProductions: RecentProduction[];
  generatedAt: string;
}
