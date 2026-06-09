export type ActivityAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "STATUS_CHANGE" | string;
export type ActivityModule = "USER" | "PRODUCT" | "MATERIAL" | "PRODUCTION" | "TRANSACTION" | "AUTH" | "RECIPE" | "STOCK_MOVEMENT" | string;

export interface ActivityLogUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "MANAGER" | "STAFF" | "KASIR" | "CUSTOMER";
}

export interface ActivityLogItem {
  id: string;
  userId?: string | null;
  action: ActivityAction;
  module: ActivityModule;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: ActivityLogUser | null;
}

export interface ActivityLogParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  module?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}
