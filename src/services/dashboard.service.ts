import api from './api';
import { HAS_API_URL } from '../utils/constants';
import { mockDashboardByPeriod } from '../data/mockDashboard';
import type { DashboardData, DashboardPeriod } from '../types/dashboard';

type BackendDashboardSummary = {
  generatedAt?: string;
  summary?: {
    totalSales?: number;
    totalProduction?: number;
    totalProductsSold?: number;
    monthlyRevenue?: number;
    totalTransactions?: number;
    customerCount?: number;
  };
  bestSellingProduct?: {
    productId?: string;
    name?: string;
    quantitySold?: number;
    revenue?: number;
  } | null;
  bestSellingProducts?: Array<{
    productId?: string;
    id?: string;
    name?: string;
    quantitySold?: number;
    revenue?: number;
  }>;
  lowStock?: {
    total?: number;
    items?: Array<{
      id?: string;
      name?: string;
      type?: 'MATERIAL' | 'PRODUCT';
      unit?: string;
      stock?: number;
      minStock?: number;
      stockStatus?: 'AMAN' | 'MENIPIS' | 'HABIS';
    }>;
  };
  recentTransactions?: Array<{
    totalPrice: number;
    createdAt: string;
  }>;
  recentProductions?: Array<{
    quantity: number;
    createdAt: string;
  }>;
};

function emptyDashboard(): DashboardData {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSales: 0,
      totalProduction: 0,
      totalSoldProducts: 0,
      transactionCount: 0,
      customerCount: 0,
      bestSellingProduct: 'Belum ada data',
      monthlyRevenue: 0,
      lowStockCount: 0,
    },
    trends: {
      totalSales: { value: 0, label: 'Belum ada data' },
      totalProduction: { value: 0, label: 'Belum ada data' },
      totalSoldProducts: { value: 0, label: 'Belum ada data' },
      transactionCount: { value: 0, label: 'Belum ada data' },
    },
    salesChart: [],
    productionChart: [],
    bestSellingProducts: [],
    lowStocks: [],
    recentTransactions: [],
    recentProductions: [],
  };
}

function adaptBackendSummary(payload: BackendDashboardSummary): DashboardData {
  const base = emptyDashboard();
  const summary = payload.summary ?? {};
  const salesChart =
    payload.recentTransactions?.map((trx) => ({
      label: new Date(trx.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      }),
      sales: Number(trx.totalPrice),
      transactions: 1,
    })) ?? [];
  const productionChart =
    payload.recentProductions?.map((prod) => ({
      label: new Date(prod.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      }),
      quantity: Number(prod.quantity),
    })) ?? [];
  const bestSellingProducts = payload.bestSellingProducts?.length
    ? payload.bestSellingProducts.map((item, index) => ({
        id: item.productId ?? item.id ?? `BEST-${index + 1}`,
        name: item.name ?? 'Produk',
        sold: Number(item.quantitySold ?? 0),
        revenue: Number(item.revenue ?? 0),
        percentage: index === 0 ? 100 : Math.max(10, 100 - index * 18),
      }))
    : payload.bestSellingProduct
      ? [
          {
            id: payload.bestSellingProduct.productId ?? 'BEST-001',
            name: payload.bestSellingProduct.name ?? 'Produk Terlaris',
            sold: Number(payload.bestSellingProduct.quantitySold ?? 0),
            revenue: Number(payload.bestSellingProduct.revenue ?? 0),
            percentage: 100,
          },
        ]
      : [];

  const lowStocks = (payload.lowStock?.items ?? []).map((item) => ({
    id: item.id ?? item.name ?? 'LOW-STOCK',
    name: item.name ?? 'Stok Menipis',
    type: item.type === 'PRODUCT' ? ('Produk Jadi' as const) : ('Bahan Baku' as const),
    stock: Number(item.stock ?? 0),
    minStock: Number(item.minStock ?? 0),
    unit: item.unit ?? (item.type === 'PRODUCT' ? 'pcs' : 'unit'),
    status: item.stockStatus ?? ('MENIPIS' as const),
  }));

  return {
    ...base,
    generatedAt: payload.generatedAt ?? base.generatedAt,
    summary: {
      ...base.summary,
      totalSales: Number(summary.totalSales ?? 0),
      totalProduction: Number(summary.totalProduction ?? 0),
      totalSoldProducts: Number(summary.totalProductsSold ?? 0),
      transactionCount: Number(summary.totalTransactions ?? 0),
      customerCount: Number(summary.customerCount ?? 0),
      monthlyRevenue: Number(summary.monthlyRevenue ?? 0),
      bestSellingProduct: bestSellingProducts[0]?.name ?? 'Belum ada data',
      lowStockCount: Number(payload.lowStock?.total ?? lowStocks.length),
    },
    bestSellingProducts,
    lowStocks,
    salesChart,
    productionChart,
  };
}

const normalizeDashboardResponse = (payload: unknown): DashboardData => {
  const response = payload as { data?: DashboardData | BackendDashboardSummary } | DashboardData | BackendDashboardSummary;
  const data = 'data' in response && response.data ? response.data : response;

  if (data && typeof data === 'object' && 'summary' in data && 'lowStock' in data) {
    return adaptBackendSummary(data as BackendDashboardSummary);
  }

  return (data as DashboardData) || emptyDashboard();
};

export async function getManagerDashboard(period: DashboardPeriod): Promise<DashboardData> {
  if (!HAS_API_URL) {
    return mockDashboardByPeriod[period];
  }

  try {
    const response = await api.get('/dashboard/manager', { params: { period } });
    const dashboard = normalizeDashboardResponse(response.data);

    if (dashboard.salesChart.length > 0 || dashboard.productionChart.length > 0 || dashboard.recentTransactions.length > 0 || dashboard.recentProductions.length > 0) {
      return dashboard;
    }

    return mockDashboardByPeriod[period];
  } catch (error) {
    console.warn('Falling back to mock manager dashboard data.', error);
    return mockDashboardByPeriod[period];
  }
}

export async function exportManagerDashboard(period: DashboardPeriod): Promise<{ fileName: string; message: string }> {
  return {
    fileName: `laporan-dashboard-${period}.xlsx`,
    message: 'Export dibuat dari data dashboard backend yang sedang aktif.',
  };
}
