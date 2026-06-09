import api from './api';
import type { OnlineOrder, OnlineOrderItem, OnlineOrderStatus, OrderFulfillmentType, OrderPaymentMethod } from '../types/orders';

export type PaymentMethodBE = 'CASH' | 'QRIS' | 'TRANSFER' | 'MIDTRANS';

type PaginationResponse<T> = { items?: T[]; meta?: unknown };

export type BackendTransaction = {
  id: string;
  invoiceNumber: string;
  userId?: string | null;
  customerId?: string | null;
  type: 'ONLINE' | 'OFFLINE';
  status: OnlineOrderStatus;
  orderType?: 'DINE_IN' | 'TAKE_AWAY' | null;
  tableNumber?: string | null;
  queueNumber?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  cashierNameSnapshot?: string | null;
  totalPrice: number | string;
  snapToken?: string | null;
  midtransToken?: string | null;
  paymentToken?: string | null;
  token?: string | null;
  redirectUrl?: string | null;
  createdAt: string;
  updatedAt?: string;
  items?: Array<{
    id?: string;
    productId: string;
    quantity: number;
    price: number | string;
    subtotal: number | string;
    product?: { id?: string; name?: string; image?: string | null } | null;
  }>;
  payment?: {
    id?: string;
    paymentMethod?: PaymentMethodBE | string | null;
    paymentStatus?: string | null;
    cashReceived?: number | string | null;
    changeAmount?: number | string | null;
    referenceNumber?: string | null;
    redirectUrl?: string | null;
    snapToken?: string | null;
    midtransToken?: string | null;
    paymentToken?: string | null;
    token?: string | null;
    paidAt?: string | null;
  } | null;
  receipt?: {
    id?: string;
    receiptNumber?: string;
    queueNumber?: string;
    cashierName?: string | null;
    issuedAt?: string;
  } | null;
};

type BackendReceipt = {
  transactionId: string;
  invoiceNumber: string;
  receipt?: { receiptNumber?: string; queueNumber?: string; issuedAt?: string } | null;
  order?: { orderType?: 'DINE_IN' | 'TAKE_AWAY' | null; tableNumber?: string | null; notes?: string | null; status?: OnlineOrderStatus; queueNumber?: string | null } | null;
  customer?: { id?: string; name?: string | null; phone?: string | null } | null;
  cashier?: { id?: string; name?: string | null } | null;
  items?: Array<{ id?: string; productId: string; name?: string; image?: string | null; quantity: number; price: number | string; subtotal: number | string }>;
  payment?: { paymentMethod?: PaymentMethodBE | string | null; cashReceived?: number | string | null; changeAmount?: number | string | null; referenceNumber?: string | null; paidAt?: string | null } | null;
  totals?: { totalPrice?: number | string } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type OfflinePosPayload = {
  items: Array<{ productId: string; quantity: number }>;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  orderType: OrderFulfillmentType;
  tableNumber?: string | null;
  notes?: string;
  paymentMethod: OrderPaymentMethod;
  cashReceived?: number | null;
  referenceNumber?: string | null;
};

export type OnlineCheckoutPayload = {
  items: Array<{ productId: string; quantity: number }>;
  customerId?: string;
  customer: { firstName: string; lastName?: string; email: string; phone: string };
  orderType: OrderFulfillmentType;
  tableNumber?: string | null;
  notes?: string;
  enabledPayments?: string[];
  callbacks?: { finish?: string; unfinish?: string; error?: string };
};

function pageItems<T>(payload: PaginationResponse<T> | T[]): T[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.items) ? payload.items : [];
}

function mapOrderType(type?: string | null): OrderFulfillmentType {
  return type === 'DINE_IN' ? 'DINE_IN' : 'TAKE_AWAY';
}

function mapPaymentMethod(method?: string | null): OrderPaymentMethod {
  const normalized = String(method || 'MIDTRANS').toUpperCase();
  if (normalized === 'CASH') return 'CASH';
  if (normalized === 'QRIS') return 'QRIS';
  if (normalized === 'TRANSFER' || normalized === 'BANK_TRANSFER') return 'TRANSFER';
  return 'MIDTRANS';
}

export function extractMidtransToken(payload: unknown): string | undefined {
  const root = payload as Record<string, unknown> | null | undefined;
  const payment = root?.payment as Record<string, unknown> | null | undefined;
  const candidates = [
    payment?.snapToken,
    payment?.midtransToken,
    payment?.paymentToken,
    payment?.token,
    root?.snapToken,
    root?.midtransToken,
    root?.paymentToken,
    root?.token,
  ];

  const token = candidates.find((value) => typeof value === 'string' && value.trim());
  return typeof token === 'string' ? token : undefined;
}

function mapItems(items?: BackendTransaction['items']): OnlineOrderItem[] {
  return (items ?? []).map((item) => ({
    productId: item.productId || item.product?.id || '',
    name: item.product?.name || 'Produk',
    image: item.product?.image || undefined,
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
    subtotal: Number(item.subtotal || 0),
  }));
}

export function mapTransactionToOnlineOrder(transaction: BackendTransaction): OnlineOrder {
  const items = mapItems(transaction.items);
  return {
    id: transaction.id,
    invoiceNumber: transaction.invoiceNumber,
    queueNumber: transaction.queueNumber || transaction.receipt?.queueNumber || transaction.receipt?.receiptNumber || transaction.invoiceNumber,
    createdAt: transaction.createdAt,
    customerName: transaction.customerName || 'Customer',
    customerPhone: transaction.customerPhone || '-',
    fulfillmentType: mapOrderType(transaction.orderType),
    tableNumber: transaction.tableNumber || undefined,
    note: transaction.notes || undefined,
    paymentMethod: mapPaymentMethod(transaction.payment?.paymentMethod),
    status: transaction.status,
    items,
    total: Number(transaction.totalPrice || items.reduce((sum, item) => sum + item.subtotal, 0)),
    receiptNumber: transaction.receipt?.receiptNumber,
    paymentRedirectUrl: transaction.payment?.redirectUrl || transaction.redirectUrl || undefined,
    snapToken: extractMidtransToken(transaction),
  };
}

export function mapReceiptToOnlineOrder(receipt: BackendReceipt): OnlineOrder {
  const items: OnlineOrderItem[] = (receipt.items ?? []).map((item) => ({
    productId: item.productId,
    name: item.name || 'Produk',
    image: item.image || undefined,
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
    subtotal: Number(item.subtotal || 0),
  }));

  return {
    id: receipt.transactionId,
    invoiceNumber: receipt.invoiceNumber,
    queueNumber: receipt.receipt?.queueNumber || receipt.order?.queueNumber || receipt.receipt?.receiptNumber || receipt.invoiceNumber,
    createdAt: receipt.createdAt || receipt.receipt?.issuedAt || new Date().toISOString(),
    customerName: receipt.customer?.name || 'Customer',
    customerPhone: receipt.customer?.phone || '-',
    fulfillmentType: mapOrderType(receipt.order?.orderType),
    tableNumber: receipt.order?.tableNumber || undefined,
    note: receipt.order?.notes || undefined,
    paymentMethod: mapPaymentMethod(receipt.payment?.paymentMethod),
    status: receipt.order?.status || 'COMPLETED',
    items,
    total: Number(receipt.totals?.totalPrice || items.reduce((sum, item) => sum + item.subtotal, 0)),
    receiptNumber: receipt.receipt?.receiptNumber,
  };
}

export async function listAllTransactions(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginationResponse<BackendTransaction>>('/transactions', { params });
  return pageItems(data).map(mapTransactionToOnlineOrder);
}

export async function listMyTransactions(params?: Record<string, unknown>) {
  const { data } = await api.get<PaginationResponse<BackendTransaction>>('/transactions/me', { params });
  return pageItems(data).map(mapTransactionToOnlineOrder);
}

export async function getTransactionById(id: string) {
  const { data } = await api.get<BackendTransaction>(`/transactions/${id}`);
  return mapTransactionToOnlineOrder(data);
}

export async function updateTransactionStatus(id: string, status: OnlineOrderStatus) {
  const { data } = await api.patch<BackendTransaction>(`/transactions/${id}/status`, { status });
  return mapTransactionToOnlineOrder(data);
}

export async function getTransactionReceipt(id: string) {
  const { data } = await api.get<BackendReceipt>(`/transactions/${id}/receipt`);
  return mapReceiptToOnlineOrder(data);
}

export async function createOnlineCheckout(payload: OnlineCheckoutPayload) {
  const { data } = await api.post<BackendTransaction>('/transactions/checkout', {
    items: payload.items,
    customerId: payload.customerId,
    orderType: payload.orderType,
    tableNumber: payload.orderType === 'DINE_IN' ? payload.tableNumber : null,
    notes: payload.notes || undefined,
    customer: payload.customer,
    enabledPayments: payload.enabledPayments ?? ['qris', 'bank_transfer'],
    callbacks: payload.callbacks ?? {
      finish: `${window.location.origin}/customer/orders`,
      unfinish: `${window.location.origin}/customer/checkout`,
      error: `${window.location.origin}/customer/checkout`,
    },
  });
  const res = mapTransactionToOnlineOrder(data);
  return res;
}

export async function createOfflineTransaction(payload: OfflinePosPayload) {
  const { data } = await api.post<BackendTransaction>('/transactions/offline', {
    items: payload.items,
    customerId: payload.customerId || undefined,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    orderType: payload.orderType,
    tableNumber: payload.orderType === 'DINE_IN' ? payload.tableNumber : null,
    notes: payload.notes || undefined,
    paymentMethod: payload.paymentMethod,
    cashReceived: payload.paymentMethod === 'CASH' ? payload.cashReceived : undefined,
    referenceNumber: payload.referenceNumber || null,
  });
  return mapTransactionToOnlineOrder(data);
}

export function getValidTransactionStatusTransitions(status: OnlineOrderStatus): OnlineOrderStatus[] {
  const transitions: Record<OnlineOrderStatus, OnlineOrderStatus[]> = {
    PENDING: ['CANCELLED'],
    PAID: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['READY', 'CANCELLED'],
    READY: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  return transitions[status] ?? [];
}
