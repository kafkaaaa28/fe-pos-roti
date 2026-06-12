const resolvedApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_URL = resolvedApiUrl ?? '';
export const ROLES = {
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  KASIR: 'KASIR',
  CUSTOMER: 'CUSTOMER',
} as const;

export const ORDER_STATUS = ['PENDING', 'PAID', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'] as const;
export const STOCK_STATUS = { AMAN: 'AMAN', MENIPIS: 'MENIPIS', HABIS: 'HABIS' } as const;
