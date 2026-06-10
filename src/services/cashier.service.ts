import api from './api';
import type { CashierDashboardData, CashierPeriod, CashierPaymentMethod } from '../types/cashier';
type BackendPayment = {
  paymentMethod: string;
  paymentStatus: string;
  cashReceived: number | null;
  changeAmount: number | null;
};
type BackendDashboardSummary = {
  generatedAt?: string;
  summary?: {
    revenueToday?: number;
    totalProductsSold?: number;
    transactionCountToday?: number;
    incomingOnlineOrders?: number;
    readyOrders?: number;
    lowStockCount?: number;
  };
  recentTransactions?: {
    id: string;
    invoiceNumber: string;
    type: string;
    status: string;
    orderType: string;
    queueNumber?: string | null;
    tableNumber?: string | null;
    customerName?: string | null;
    customerPhone?: string | null;
    totalPrice: number;
    createdAt: string | Date;
    payment: BackendPayment | null;
    receipt?: unknown;
    items?: unknown[];
  }[];
};
function normalizePaymentMethod(method?: string | null): CashierPaymentMethod | null {
  switch (method) {
    case 'CASH':
      return 'Cash';

    case 'QRIS':
      return 'QRIS';

    case 'TRANSFER':
      return 'Bank Transfer';

    case 'MIDTRANS':
      return 'E-Wallet';

    default:
      return null;
  }
}
function buildTransactionTrendFromRecentTransactions(transactions: BackendDashboardSummary['recentTransactions'] = []): CashierDashboardData['transactionTrend'] {
  const grouped = new Map<string, { revenue: number; transactions: number }>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.createdAt);

    if (Number.isNaN(date.getTime())) return;

    const hour = String(date.getHours()).padStart(2, '0');

    const current = grouped.get(hour) ?? {
      revenue: 0,
      transactions: 0,
    };

    grouped.set(hour, {
      revenue: current.revenue + Number(transaction.totalPrice ?? 0),
      transactions: current.transactions + 1,
    });
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([label, value]) => ({
      label,
      revenue: value.revenue,
      transactions: value.transactions,
    }));
}

function isPaidPaymentStatus(status?: string | null): boolean {
  if (!status) return false;

  const normalized = status.toUpperCase();

  return ['PAID', 'SETTLEMENT', 'SUCCESS'].includes(normalized);
}

function buildPaymentBreakdownFromRecentTransactions(transactions: BackendDashboardSummary['recentTransactions'] = []): CashierDashboardData['paymentBreakdown'] {
  const grouped = new Map<CashierPaymentMethod, { total: number; count: number }>();

  transactions.forEach((transaction) => {
    const payment = transaction.payment;

    if (!payment) return;

    if (!isPaidPaymentStatus(payment.paymentStatus)) return;

    const method = normalizePaymentMethod(payment.paymentMethod);

    if (!method) return;

    const current = grouped.get(method) ?? {
      total: 0,
      count: 0,
    };

    grouped.set(method, {
      total: current.total + Number(transaction.totalPrice ?? 0),
      count: current.count + 1,
    });
  });

  const grandTotal = Array.from(grouped.values()).reduce((sum, item) => sum + item.total, 0);

  return Array.from(grouped.entries()).map(([method, value]) => ({
    method,
    total: value.total,
    count: value.count,
    percentage: grandTotal > 0 ? Math.round((value.total / grandTotal) * 100) : 0,
  }));
}

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
      todayRevenue: { value: 0, label: 'Belum ada data' },
      todayTransactions: { value: 0, label: 'Belum ada data' },
      onlineOrders: { value: 0, label: 'Belum ada data' },
      readyOrders: { value: 0, label: 'Belum ada data' },
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
      todayRevenue: Number(summary.revenueToday ?? 0),
      todayTransactions: Number(summary.transactionCountToday ?? 0),
      onlineOrders: Number(summary.incomingOnlineOrders ?? 0),
      readyOrders: Number(summary.readyOrders ?? 0),
      soldProducts: Number(summary.totalProductsSold ?? 0),
      pendingOrders: Number(payload.summary?.lowStockCount ?? 0),
    },
    transactionTrend: buildTransactionTrendFromRecentTransactions(payload.recentTransactions),
    paymentBreakdown: buildPaymentBreakdownFromRecentTransactions(payload.recentTransactions),
  };
}

export async function getCashierDashboard(period: CashierPeriod): Promise<CashierDashboardData> {
  const response = await api.get<BackendDashboardSummary>('/dashboard/kasir', { params: { period } });
  return adaptBackendSummary(response.data, period);
}
