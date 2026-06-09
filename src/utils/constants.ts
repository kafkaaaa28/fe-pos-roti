export const API_URL = 'http://127.0.0.1:5000';

export const ROLES = {
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  KASIR: 'KASIR',
  CUSTOMER: 'CUSTOMER',
} as const;

export const ORDER_STATUS = ['PENDING', 'PAID', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'] as const;
export const STOCK_STATUS = { AMAN: 'AMAN', MENIPIS: 'MENIPIS', HABIS: 'HABIS' } as const;
