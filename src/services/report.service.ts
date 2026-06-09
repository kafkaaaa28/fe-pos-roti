import api from "./api";
import type { DashboardPeriod, StockStatus, TransactionStatus, TransactionType } from "../types/dashboard";
import type {
  ManagerReportsData,
  ProductionReportItem,
  ReportSummaryItem,
  ReportType,
  SalesReportItem,
  StockReportItem,
  TransactionReportItem,
} from "../types/reports";
import { formatNumber, formatRupiah } from "../utils/formatter";

type PaginationResponse<T> = {
  items?: T[];
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
  summary?: Record<string, unknown>;
  filters?: Record<string, unknown>;
};

type BackendSalesItem = {
  id: string;
  invoiceNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  type: TransactionType;
  orderType?: "DINE_IN" | "TAKE_AWAY" | null;
  status: TransactionStatus;
  paymentMethod?: string | null;
  totalPrice: number | string;
  totalQty?: number | string;
  totalItems?: number | string;
  productCount?: number | string;
  createdAt: string;
};

type BackendProductionItem = {
  id: string;
  productId?: string;
  quantity: number | string;
  notes?: string | null;
  createdAt: string;
  product?: { name?: string | null } | null;
  user?: { name?: string | null } | null;
};

type BackendInventoryItem = {
  id: string;
  name: string;
  type?: "PRODUCT" | "MATERIAL" | string;
  stock: number | string;
  minStock: number | string;
  unit?: string | null;
  stockStatus?: StockStatus;
  status?: StockStatus;
  lastMovement?: string | null;
  updatedAt?: string;
};

type BackendTransactionItem = BackendSalesItem;

const pageItems = <T>(payload: PaginationResponse<T> | T[]): T[] => {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.items) ? payload.items : [];
};

const safeStatus = (status?: string | null): TransactionStatus => {
  const value = String(status || "COMPLETED").toUpperCase();
  if (["PENDING", "PAID", "PROCESSING", "READY", "COMPLETED", "CANCELLED"].includes(value)) return value as TransactionStatus;
  return "COMPLETED";
};

const safeType = (type?: string | null): TransactionType => (String(type).toUpperCase() === "ONLINE" ? "ONLINE" : "OFFLINE");

const paymentLabel = (method?: string | null): TransactionReportItem["paymentMethod"] => {
  const value = String(method || "CASH").toUpperCase();
  if (value === "QRIS") return "QRIS";
  if (value === "TRANSFER" || value === "BANK_TRANSFER") return "Bank Transfer";
  if (value === "EWALLET" || value === "E-WALLET") return "E-Wallet";
  return "Cash";
};

const stockStatus = (item: BackendInventoryItem): StockStatus => {
  if (item.stockStatus) return item.stockStatus;
  if (item.status) return item.status;
  const stock = Number(item.stock || 0);
  const min = Number(item.minStock || 0);
  if (stock <= 0) return "HABIS";
  if (stock <= min) return "MENIPIS";
  return "AMAN";
};

function mapSales(item: BackendSalesItem): SalesReportItem {
  const qty = Number(item.totalQty ?? item.totalItems ?? item.productCount ?? 1);
  return {
    id: item.id,
    date: item.createdAt,
    invoiceNumber: item.invoiceNumber,
    customerName: item.customerName || "Walk-in Customer",
    type: safeType(item.type),
    productCount: Number(item.productCount ?? 1),
    totalQty: qty,
    totalPrice: Number(item.totalPrice || 0),
    status: safeStatus(item.status),
  };
}

function mapProduction(item: BackendProductionItem): ProductionReportItem {
  return {
    id: item.id,
    date: item.createdAt,
    productionNumber: item.id,
    productName: item.product?.name || "Produk",
    quantity: Number(item.quantity || 0),
    staffName: item.user?.name || "Staff",
    status: "Selesai",
    notes: item.notes || "-",
  };
}

function mapInventory(item: BackendInventoryItem): StockReportItem {
  const type = String(item.type || "MATERIAL").toUpperCase() === "PRODUCT" ? "Produk Jadi" : "Bahan Baku";
  return {
    id: item.id,
    name: item.name,
    type,
    stock: Number(item.stock || 0),
    minStock: Number(item.minStock || 0),
    unit: item.unit || (type === "Produk Jadi" ? "pcs" : "unit"),
    status: stockStatus(item),
    lastMovement: item.lastMovement || "Data terakhir dari backend",
  };
}

function mapTransaction(item: BackendTransactionItem): TransactionReportItem {
  return {
    id: item.id,
    date: item.createdAt,
    invoiceNumber: item.invoiceNumber,
    customerName: item.customerName || "Walk-in Customer",
    type: safeType(item.type),
    paymentMethod: paymentLabel(item.paymentMethod),
    totalPrice: Number(item.totalPrice || 0),
    status: safeStatus(item.status),
  };
}

const makeSummaries = (data: {
  sales: SalesReportItem[];
  production: ProductionReportItem[];
  stock: StockReportItem[];
  transaction: TransactionReportItem[];
}, backend?: Record<ReportType, Record<string, unknown>>): Record<ReportType, ReportSummaryItem[]> => {
  const totalSales = data.sales.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalQty = data.sales.reduce((sum, item) => sum + item.totalQty, 0);
  const totalProduction = data.production.reduce((sum, item) => sum + item.quantity, 0);
  const totalTransaction = data.transaction.reduce((sum, item) => sum + item.totalPrice, 0);
  const lowStock = data.stock.filter((item) => item.status !== "AMAN").length;

  const salesSummary = backend?.sales ?? {};
  const productionSummary = backend?.production ?? {};
  const stockSummary = backend?.stock ?? {};
  const transactionSummary = backend?.transaction ?? {};

  return {
    sales: [
      { label: "Total Penjualan", value: formatRupiah(Number(salesSummary.totalRevenue ?? totalSales)), helper: "Akumulasi omzet sesuai periode" },
      { label: "Produk Terjual", value: `${formatNumber(Number(salesSummary.totalItemsSold ?? totalQty))} item`, helper: "Jumlah item dari transaksi" },
      { label: "Jumlah Invoice", value: Number(salesSummary.totalTransactions ?? data.sales.length), helper: "Transaksi tercatat" },
      { label: "Rata-rata Transaksi", value: formatRupiah(Math.round(Number(salesSummary.totalRevenue ?? totalSales) / Math.max(1, Number(salesSummary.totalTransactions ?? data.sales.length)))), helper: "Omzet rata-rata per invoice" },
    ],
    production: [
      { label: "Total Produksi", value: `${formatNumber(Number(productionSummary.totalQuantityProduced ?? totalProduction))} pcs`, helper: "Akumulasi produksi" },
      { label: "Batch Produksi", value: Number(productionSummary.totalProductionBatches ?? data.production.length), helper: "Jumlah batch tercatat" },
      { label: "Selesai", value: data.production.filter((item) => item.status === "Selesai").length, helper: "Batch selesai" },
      { label: "Perlu Dicek", value: data.production.filter((item) => item.status !== "Selesai").length, helper: "Diproses/tertunda" },
    ],
    stock: [
      { label: "Total Produk", value: Number(stockSummary.totalProducts ?? data.stock.filter((item) => item.type === "Produk Jadi").length), helper: "Produk jadi" },
      { label: "Total Bahan", value: Number(stockSummary.totalMaterials ?? data.stock.filter((item) => item.type === "Bahan Baku").length), helper: "Bahan baku" },
      { label: "Stok Menipis", value: Number((stockSummary.lowStockProducts as number | undefined) ?? 0) + Number((stockSummary.lowStockMaterials as number | undefined) ?? lowStock), helper: "Perlu restock" },
      { label: "Stok Habis", value: data.stock.filter((item) => item.status === "HABIS").length, helper: "Harus segera ditangani" },
    ],
    transaction: [
      { label: "Total Transaksi", value: Number(transactionSummary.totalTransactions ?? data.transaction.length), helper: "POS dan online" },
      { label: "Nominal Transaksi", value: formatRupiah(totalTransaction), helper: "Total nominal" },
      { label: "Online", value: Number(transactionSummary.totalOnlineTransactions ?? data.transaction.filter((item) => item.type === "ONLINE").length), helper: "Pesanan website" },
      { label: "Offline", value: Number(transactionSummary.totalOfflineTransactions ?? data.transaction.filter((item) => item.type === "OFFLINE").length), helper: "Transaksi POS" },
    ],
  };
};

async function loadBackendReports(period: DashboardPeriod): Promise<ManagerReportsData> {
  const params = { period, limit: 100 };
  const [salesRes, productionRes, stockRes, transactionRes] = await Promise.all([
    api.get<PaginationResponse<BackendSalesItem>>("/reports/sales", { params }),
    api.get<PaginationResponse<BackendProductionItem>>("/reports/productions", { params }),
    api.get<PaginationResponse<BackendInventoryItem>>("/reports/inventory", { params }),
    api.get<PaginationResponse<BackendTransactionItem>>("/reports/transactions", { params }),
  ]);

  const data = {
    sales: pageItems(salesRes.data).map(mapSales),
    production: pageItems(productionRes.data).map(mapProduction),
    stock: pageItems(stockRes.data).map(mapInventory),
    transaction: pageItems(transactionRes.data).map(mapTransaction),
  };

  return {
    generatedAt: new Date().toISOString(),
    summaries: makeSummaries(data, {
      sales: salesRes.data.summary ?? {},
      production: productionRes.data.summary ?? {},
      stock: stockRes.data.summary ?? {},
      transaction: transactionRes.data.summary ?? {},
    }),
    ...data,
  };
}

export async function getManagerReports(period: DashboardPeriod): Promise<ManagerReportsData> {
  return loadBackendReports(period);
}

export async function getManagerReportByType(period: DashboardPeriod, reportType: ReportType): Promise<ManagerReportsData> {
  const endpointMap: Record<ReportType, string> = {
    sales: "/reports/sales",
    production: "/reports/productions",
    stock: "/reports/inventory",
    transaction: "/reports/transactions",
  };
  await api.get(endpointMap[reportType], { params: { period, limit: 100 } });
  return loadBackendReports(period);
}
