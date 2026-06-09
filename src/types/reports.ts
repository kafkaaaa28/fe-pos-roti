import type { DashboardPeriod, StockStatus, TransactionStatus, TransactionType } from "./dashboard";

export type ReportType = "sales" | "production" | "stock" | "transaction";
export type ReportExportFormat = "excel" | "pdf";

export interface ReportSummaryItem {
  label: string;
  value: string | number;
  helper: string;
}

export interface SalesReportItem {
  id: string;
  date: string;
  invoiceNumber: string;
  customerName: string;
  type: TransactionType;
  productCount: number;
  totalQty: number;
  totalPrice: number;
  status: TransactionStatus;
}

export interface ProductionReportItem {
  id: string;
  date: string;
  productionNumber: string;
  productName: string;
  quantity: number;
  staffName: string;
  status: "Selesai" | "Diproses" | "Tertunda";
  notes: string;
}

export interface StockReportItem {
  id: string;
  name: string;
  type: "Bahan Baku" | "Produk Jadi";
  stock: number;
  minStock: number;
  unit: string;
  status: StockStatus;
  lastMovement: string;
}

export interface TransactionReportItem {
  id: string;
  date: string;
  invoiceNumber: string;
  customerName: string;
  type: TransactionType;
  paymentMethod: "Cash" | "QRIS" | "Bank Transfer" | "E-Wallet";
  totalPrice: number;
  status: TransactionStatus;
}

export interface ManagerReportsData {
  generatedAt: string;
  summaries: Record<ReportType, ReportSummaryItem[]>;
  sales: SalesReportItem[];
  production: ProductionReportItem[];
  stock: StockReportItem[];
  transaction: TransactionReportItem[];
}

export interface ReportMeta {
  type: ReportType;
  title: string;
  shortTitle: string;
  description: string;
  endpoint: string;
}

export interface ReportExportPayload {
  data: ManagerReportsData;
  reportType: ReportType;
  reportTitle: string;
  period: DashboardPeriod;
  periodLabel: string;
  format: ReportExportFormat;
}
