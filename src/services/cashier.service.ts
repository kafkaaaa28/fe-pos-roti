import api from "./api";
import { getMockCashierDashboard } from "../data/mockCashier";
import type { CashierDashboardData, CashierPeriod } from "../types/cashier";

type BackendDashboardSummary = {
  generatedAt?: string;
  summary?: {
    totalSales?: number;
    totalProductsSold?: number;
    totalTransactions?: number;
  };
  lowStock?: { total?: number };
};

function adaptBackendSummary(payload: BackendDashboardSummary, period: CashierPeriod): CashierDashboardData {
  const fallback = getMockCashierDashboard(period);
  const summary = payload.summary ?? {};

  return {
    ...fallback,
    generatedAt: payload.generatedAt ?? fallback.generatedAt,
    summary: {
      ...fallback.summary,
      todayRevenue: Number(summary.totalSales ?? fallback.summary.todayRevenue),
      todayTransactions: Number(summary.totalTransactions ?? fallback.summary.todayTransactions),
      soldProducts: Number(summary.totalProductsSold ?? fallback.summary.soldProducts),
      pendingOrders: Number(payload.lowStock?.total ?? fallback.summary.pendingOrders),
    },
  };
}

export async function getCashierDashboard(period: CashierPeriod): Promise<CashierDashboardData> {
  try {
    const response = await api.get<BackendDashboardSummary>("/dashboard/kasir", { params: { period } });
    return adaptBackendSummary(response.data, period);
  } catch {
    await new Promise((resolve) => window.setTimeout(resolve, 350));
    return getMockCashierDashboard(period);
  }
}
