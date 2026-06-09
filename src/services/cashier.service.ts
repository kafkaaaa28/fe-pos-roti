import api from "./api";
import type { CashierDashboardData, CashierPeriod } from "../types/cashier";

type BackendDashboardSummary = {
  generatedAt?: string;
  summary?: {
    totalSales?: number;
    totalProductsSold?: number;
    totalTransactions?: number;
    onlineOrders?: number;
    readyOrders?: number;
  };
  lowStock?: { total?: number };
};

function emptyCashierDashboard(period: CashierPeriod): CashierDashboardData {
  return {
    generatedAt: new Date().toISOString(),
    period,
    summary: {
      todayRevenue: 0,
      todayTransactions: 0,
      onlineOrders: 0,
      readyOrders: 0,
      pendingOrders: 0,
      soldProducts: 0,
    },
    trends: {
      todayRevenue: { value: 0, label: "Belum ada data" },
      todayTransactions: { value: 0, label: "Belum ada data" },
      onlineOrders: { value: 0, label: "Belum ada data" },
      readyOrders: { value: 0, label: "Belum ada data" },
    },
    transactionTrend: [],
    recentTransactions: [],
    onlineOrders: [],
    stockWarnings: [],
    paymentBreakdown: [],
  };
}

function adaptBackendSummary(payload: BackendDashboardSummary, period: CashierPeriod): CashierDashboardData {
  const empty = emptyCashierDashboard(period);
  const summary = payload.summary ?? {};

  return {
    ...empty,
    generatedAt: payload.generatedAt ?? empty.generatedAt,
    summary: {
      ...empty.summary,
      todayRevenue: Number(summary.totalSales ?? 0),
      todayTransactions: Number(summary.totalTransactions ?? 0),
      onlineOrders: Number(summary.onlineOrders ?? 0),
      readyOrders: Number(summary.readyOrders ?? 0),
      soldProducts: Number(summary.totalProductsSold ?? 0),
      pendingOrders: Number(payload.lowStock?.total ?? 0),
    },
  };
}

export async function getCashierDashboard(period: CashierPeriod): Promise<CashierDashboardData> {
  const response = await api.get<BackendDashboardSummary>("/dashboard/kasir", { params: { period } });
  return adaptBackendSummary(response.data, period);
}
