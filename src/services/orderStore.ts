import type { CreateOnlineOrderPayload, OnlineOrder, OnlineOrderStatus } from '../types/orders';
import {
  createOnlineCheckout,
  getValidTransactionStatusTransitions,
  listAllTransactions,
  listMyTransactions,
  updateTransactionStatus,
} from './transaction.service';

export function getOnlineOrders(): OnlineOrder[] {
  return [];
}

export function getCustomerOrders(): OnlineOrder[] {
  return [];
}

export async function fetchCashierOrders() {
  return listAllTransactions({ limit: 100, type: 'ONLINE' });
}

export async function fetchCustomerOrders() {
  return listMyTransactions({ limit: 100 });
}

export async function createOnlineOrder(payload: CreateOnlineOrderPayload) {
  const [firstName, ...rest] = payload.customerName.trim().split(/\s+/);

  return createOnlineCheckout({
    items: payload.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
    })),
    customerId: payload.customerId,
    orderType: payload.fulfillmentType,
    tableNumber: payload.fulfillmentType === 'DINE_IN' ? payload.tableNumber : null,
    notes: payload.note,
    customer: {
      firstName: firstName || payload.customerName,
      lastName: rest.join(' ') || undefined,
      email: payload.customerEmail || 'customer@beardpapas.local',
      phone: payload.customerPhone,
    },
    enabledPayments: payload.paymentMethod === 'TRANSFER' ? ['bank_transfer'] : ['qris'],
  });
}

export async function updateOnlineOrderStatus(orderId: string, status: OnlineOrderStatus) {
  return updateTransactionStatus(orderId, status);
}

export function getValidOnlineOrderStatusTransitions(status: OnlineOrderStatus) {
  return getValidTransactionStatusTransitions(status);
}

export function getNextCashierStatus(status: OnlineOrderStatus): OnlineOrderStatus | null {
  if (status === 'PAID') return 'PROCESSING';
  if (status === 'PROCESSING') return 'READY';
  if (status === 'READY') return 'COMPLETED';
  return null;
}

export function getStatusLabel(status: OnlineOrderStatus, fulfillmentType?: OnlineOrder['fulfillmentType']) {
  const labels: Record<OnlineOrderStatus, string> = {
    PENDING: 'Menunggu Pembayaran',
    PAID: 'Sudah Dibayar',
    PROCESSING: 'Sedang Diproses',
    READY: fulfillmentType === 'DINE_IN' ? 'Siap Disajikan' : 'Siap Diambil',
    COMPLETED: 'Selesai',
    CANCELLED: 'Dibatalkan',
  };
  return labels[status];
}

export function getFulfillmentLabel(type: OnlineOrder['fulfillmentType']) {
  return type === 'DINE_IN' ? 'Dine In' : 'Take Away';
}

export function getPaymentLabel(method: OnlineOrder['paymentMethod']) {
  if (method === 'CASH') return 'Cash';
  if (method === 'QRIS') return 'QRIS';
  if (method === 'MIDTRANS') return 'Midtrans';
  return 'Transfer';
}
