import type { CreateOnlineOrderPayload, OnlineOrder, OnlineOrderStatus } from '../types/orders';
import { createOnlineCheckout, listAllTransactions, listMyTransactions, updateTransactionStatus } from './transaction.service';

const ORDER_STORAGE_KEY = 'beard-papas-online-orders';

function buildOrderId() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const time = now.toTimeString().slice(0, 8).replaceAll(':', '');
  return `ORD-${date}-${time}`;
}

function buildQueueNumber() {
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = readOrders().filter((order) => order.createdAt.slice(0, 10) === today);
  const nextNumber = todayOrders.length + 1;
  return `A${String(nextNumber).padStart(3, '0')}`;
}

const initialOrders: OnlineOrder[] = [
  {
    id: 'ORD-20260608-001',
    invoiceNumber: 'ORD-20260608-001',
    queueNumber: 'A001',
    createdAt: '2026-06-08T09:30:00.000Z',
    customerName: 'Rina',
    customerPhone: '081234567890',
    fulfillmentType: 'TAKE_AWAY',
    paymentMethod: 'QRIS',
    status: 'PAID',
    note: 'Ambil jam 11.00',
    items: [
      { productId: 'shell-1', name: 'Original Cream Puff', quantity: 2, price: 28000, subtotal: 56000 },
      { productId: 'dessert-3', name: 'Japanese Cheesecake', quantity: 1, price: 40000, subtotal: 40000 },
    ],
    total: 96000,
  },
  {
    id: 'ORD-20260608-002',
    invoiceNumber: 'ORD-20260608-002',
    queueNumber: 'A002',
    createdAt: '2026-06-08T10:05:00.000Z',
    customerName: 'Dani',
    customerPhone: '082233445566',
    fulfillmentType: 'DINE_IN',
    tableNumber: 'A3',
    paymentMethod: 'TRANSFER',
    status: 'PROCESSING',
    note: 'Tidak terlalu manis',
    items: [
      { productId: 'shell-2', name: 'Chocolate Eclair', quantity: 1, price: 32000, subtotal: 32000 },
      { productId: 'filling-2', name: 'Green Tea Filled Eclair', quantity: 1, price: 32000, subtotal: 32000 },
    ],
    total: 64000,
  },
  {
    id: 'ORD-20260608-003',
    invoiceNumber: 'ORD-20260608-003',
    queueNumber: 'A003',
    createdAt: '2026-06-08T10:45:00.000Z',
    customerName: 'Maya',
    customerPhone: '083344556677',
    fulfillmentType: 'TAKE_AWAY',
    paymentMethod: 'CASH',
    status: 'PENDING',
    note: 'Bayar cash saat ambil',
    items: [{ productId: 'dessert-1', name: 'Creme Brulee', quantity: 1, price: 38000, subtotal: 38000 }],
    total: 38000,
  },
];

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeLegacyOrder(order: OnlineOrder): OnlineOrder {
  return {
    ...order,
    fulfillmentType: order.fulfillmentType === 'DINE_IN' ? 'DINE_IN' : 'TAKE_AWAY',
    invoiceNumber: order.invoiceNumber || order.id,
  };
}

function readOrders(): OnlineOrder[] {
  if (!canUseStorage()) return initialOrders;

  const raw = localStorage.getItem(ORDER_STORAGE_KEY) || localStorage.getItem('papa-bread-online-orders');
  if (!raw) {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(initialOrders));
    return initialOrders;
  }

  try {
    const parsed = JSON.parse(raw) as OnlineOrder[];
    return parsed.map(normalizeLegacyOrder);
  } catch {
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(initialOrders));
    return initialOrders;
  }
}

function writeOrders(orders: OnlineOrder[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent('beard-papas-orders-updated'));
  window.dispatchEvent(new CustomEvent('papa-bread-orders-updated'));
}

export function getOnlineOrders() {
  return readOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function fetchCashierOrders() {
  try {
    const orders = await listAllTransactions({ limit: 100, type: 'ONLINE' });
    if (orders.length) writeOrders(orders);
    return orders.length ? orders : getOnlineOrders();
  } catch {
    return getOnlineOrders();
  }
}

export async function fetchCustomerOrders() {
  try {
    const orders = await listMyTransactions({ limit: 100 });
    if (orders.length) writeOrders(orders);
    return orders.length ? orders : getOnlineOrders();
  } catch {
    return getOnlineOrders();
  }
}

export async function createOnlineOrder(payload: CreateOnlineOrderPayload) {
  try {
    const [firstName, ...rest] = payload.customerName.trim().split(/\s+/);
    const order = await createOnlineCheckout({
      items: payload.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
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
      enabledPayments: payload.paymentMethod === 'QRIS' ? ['qris'] : payload.paymentMethod === 'TRANSFER' ? ['bank_transfer'] : ['qris', 'bank_transfer'],
    });
    writeOrders([order, ...readOrders().filter((item) => item.id !== order.id)]);
    return order;
  } catch {
    const total = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order: OnlineOrder = {
      id: buildOrderId(),
      invoiceNumber: buildOrderId(),
      queueNumber: buildQueueNumber(),
      createdAt: new Date().toISOString(),
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      fulfillmentType: payload.fulfillmentType,
      tableNumber: payload.fulfillmentType === 'DINE_IN' ? payload.tableNumber : undefined,
      note: payload.note,
      paymentMethod: payload.paymentMethod,
      status: payload.paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
      items: payload.items.map((item) => ({ ...item, subtotal: item.price * item.quantity })),
      total,
    };

    writeOrders([order, ...readOrders()]);
    return order;
  }
}

export async function updateOnlineOrderStatus(orderId: string, status: OnlineOrderStatus) {
  try {
    const updated = await updateTransactionStatus(orderId, status);
    const nextOrders = readOrders().map((order) => (order.id === orderId ? updated : order));
    writeOrders(nextOrders.some((order) => order.id === updated.id) ? nextOrders : [updated, ...nextOrders]);
    return updated;
  } catch {
    const orders = readOrders();
    const nextOrders = orders.map((order) => (order.id === orderId ? { ...order, status } : order));
    writeOrders(nextOrders);
    return nextOrders.find((order) => order.id === orderId) ?? null;
  }
}

export function getCustomerOrders(customerPhone?: string) {
  const orders = getOnlineOrders();
  if (!customerPhone) return orders;
  const normalized = customerPhone.replace(/[^0-9]/g, '');
  return orders.filter((order) => order.customerPhone.replace(/[^0-9]/g, '') === normalized);
}

export function getNextCashierStatus(status: OnlineOrderStatus): OnlineOrderStatus | null {
  if (status === 'PENDING') return null;
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
