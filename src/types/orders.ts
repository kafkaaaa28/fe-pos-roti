import type { PublicProductCategory } from '../data/publicProducts';

export type OnlineOrderStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type OrderFulfillmentType = 'DINE_IN' | 'TAKE_AWAY';
export type OrderPaymentMethod = 'CASH' | 'QRIS' | 'TRANSFER' | 'MIDTRANS';

export type OnlineOrderItem = {
  productId: string;
  name: string;
  image?: string;
  category?: PublicProductCategory;
  quantity: number;
  price: number;
  subtotal: number;
};

export type OnlineOrder = {
  id: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  queueNumber?: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  fulfillmentType: OrderFulfillmentType;
  tableNumber?: string;
  note?: string;
  paymentMethod: OrderPaymentMethod;
  status: OnlineOrderStatus;
  items: OnlineOrderItem[];
  total: number;
  paymentRedirectUrl?: string;
  snapToken?: string;
};

export type CreateOnlineOrderPayload = {
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  fulfillmentType: OrderFulfillmentType;
  tableNumber?: string;
  note?: string;
  paymentMethod: OrderPaymentMethod;
  items: Omit<OnlineOrderItem, 'subtotal'>[];
};
