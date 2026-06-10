export const API_URL = import.meta.env.VITE_API_URL;
export const ROLES = {
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  KASIR: 'KASIR',
  CUSTOMER: 'CUSTOMER',
} as const;

export const ORDER_STATUS = ['PENDING', 'PAID', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'] as const;
export const STOCK_STATUS = { AMAN: 'AMAN', MENIPIS: 'MENIPIS', HABIS: 'HABIS' } as const;
