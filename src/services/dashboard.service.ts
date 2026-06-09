import api from "./api";
import { mockDashboardByPeriod } from "../data/mockDashboard";
import type { DashboardData, DashboardPeriod } from "../types/dashboard";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type BackendDashboardSummary = {
  generatedAt?: string;
  summary?: {
    totalSales?: number;
    totalProduction?: number;
    totalProductsSold?: number;
    monthlyRevenue?: number;
    totalTransactions?: number;
  };
  bestSellingProduct?: {
    productId?: string;
    name?: string;
    image?: string;
    quantitySold?: number;
    revenue?: number;
    stockStatus?: "AMAN" | "MENIPIS" | "HABIS";
  } | null;
  bestSellingProducts?: Array<{
    productId?: string;
    id?: string;
    name?: string;
    quantitySold?: number;
    revenue?: number;
    stockStatus?: "AMAN" | "MENIPIS" | "HABIS";
  }>;
  lowStock?: {
    total?: number;
    items?: Array<{
      id?: string;
      name?: string;
      type?: "MATERIAL" | "PRODUCT";
      unit?: string;
      stock?: number;
      minStock?: number;
      stockStatus?: "AMAN" | "MENIPIS" | "HABIS";
    }>;
  };
};

function adaptBackendSummary(payload: BackendDashboardSummary, period: DashboardPeriod): DashboardData {
  const fallback = mockDashboardByPeriod[period];
  const summary = payload.summary ?? {};
  const bestSellingProducts = payload.bestSellingProducts?.length
    ? payload.bestSellingProducts.map((item, index) => ({
        id: item.productId ?? item.id ?? `BEST-${index + 1}`,
        name: item.name ?? "Produk",
        sold: Number(item.quantitySold ?? 0),
        revenue: Number(item.revenue ?? 0),
        percentage: index === 0 ? 100 : Math.max(10, 100 - index * 18),
      }))
    : payload.bestSellingProduct
      ? [{
          id: payload.bestSellingProduct.productId ?? "BEST-001",
          name: payload.bestSellingProduct.name ?? "Produk Terlaris",
          sold: Number(payload.bestSellingProduct.quantitySold ?? 0),
          revenue: Number(payload.bestSellingProduct.revenue ?? 0),
          percentage: 100,
        }]
      : fallback.bestSellingProducts;

  const lowStocks = payload.lowStock?.items?.length
    ? payload.lowStock.items.map((item) => ({
        id: item.id ?? item.name ?? "LOW-STOCK",
        name: item.name ?? "Stok Menipis",
        type: item.type === "PRODUCT" ? "Produk Jadi" as const : "Bahan Baku" as const,
        stock: Number(item.stock ?? 0),
        minStock: Number(item.minStock ?? 0),
        unit: item.unit ?? (item.type === "PRODUCT" ? "pcs" : "unit"),
        status: item.stockStatus ?? "MENIPIS" as const,
      }))
    : fallback.lowStocks;

  return {
    ...fallback,
    generatedAt: payload.generatedAt ?? fallback.generatedAt,
    summary: {
      ...fallback.summary,
      totalSales: Number(summary.totalSales ?? fallback.summary.totalSales),
      totalProduction: Number(summary.totalProduction ?? fallback.summary.totalProduction),
      totalSoldProducts: Number(summary.totalProductsSold ?? fallback.summary.totalSoldProducts),
      transactionCount: Number(summary.totalTransactions ?? fallback.summary.transactionCount),
      monthlyRevenue: Number(summary.monthlyRevenue ?? fallback.summary.monthlyRevenue),
      bestSellingProduct: bestSellingProducts[0]?.name ?? fallback.summary.bestSellingProduct,
      lowStockCount: Number(payload.lowStock?.total ?? lowStocks.length),
    },
    bestSellingProducts,
    lowStocks,
  };
}

const normalizeDashboardResponse = (payload: unknown, period: DashboardPeriod): DashboardData => {
  const response = payload as { data?: DashboardData | BackendDashboardSummary } | DashboardData | BackendDashboardSummary;
  const data = "data" in response && response.data ? response.data : response;

  if (data && typeof data === "object" && "summary" in data && "lowStock" in data) {
    return adaptBackendSummary(data as BackendDashboardSummary, period);
  }

  return (data as DashboardData) || mockDashboardByPeriod[period];
};

export async function getManagerDashboard(period: DashboardPeriod): Promise<DashboardData> {
  try {
    const response = await api.get("/dashboard/manager", { params: { period } });
    return normalizeDashboardResponse(response.data, period);
  } catch {
    await wait(450);
    return mockDashboardByPeriod[period];
  }
}

export async function exportManagerDashboard(period: DashboardPeriod): Promise<{ fileName: string; message: string }> {
  await wait(250);
  return {
    fileName: `laporan-dashboard-${period}.xlsx`,
    message: "Export FE disiapkan dari data dashboard aktif. Endpoint BE export dapat ditambahkan nanti bila diperlukan.",
  };
}
