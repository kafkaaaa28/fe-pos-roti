import api from './api';
import type { PaginationMeta } from './category.service';

export type PaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'MIDTRANS';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | string;

export type Payment = {
  id: string;
  transactionId?: string | null;
  orderId?: string | null;
  midtransOrderId?: string | null;
  paymentMethod?: PaymentMethod | string | null;
  paymentStatus?: PaymentStatus | null;
  amount?: number | string | null;
  totalPrice?: number | string | null;
  cashReceived?: number | string | null;
  changeAmount?: number | string | null;
  referenceNumber?: string | null;
  snapToken?: string | null;
  redirectUrl?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  transaction?: {
    id?: string;
    invoiceNumber?: string;
    customerName?: string | null;
    totalPrice?: number | string;
  } | null;
};

export type PaymentQuery = {
  page?: number;
  limit?: number;
  paymentStatus?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  midtransOrderId?: string;
};

type PaginationResponse<T> = {
  items?: T[];
  data?: T[];
  meta?: PaginationMeta;
};

function pageItems<T>(payload: PaginationResponse<T> | T[]): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function withPagination<T>(payload: PaginationResponse<T> | T[]) {
  return {
    items: pageItems(payload),
    meta: Array.isArray(payload) ? undefined : payload.meta,
  };
}

export async function listMyPayments(params?: PaymentQuery) {
  const { data } = await api.get<PaginationResponse<Payment>>('/payments/me', { params });
  return withPagination(data);
}

export async function listPayments(params?: PaymentQuery) {
  const { data } = await api.get<PaginationResponse<Payment>>('/payments', { params });
  return withPagination(data);
}

export async function getPayment(id: string) {
  const { data } = await api.get<Payment>(`/payments/${id}`);
  return data;
}

export async function getPaymentByOrderId(orderId: string) {
  const { data } = await api.get<Payment>(`/payments/order/${orderId}`);
  return data;
}
