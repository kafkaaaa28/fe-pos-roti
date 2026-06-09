import api from "./api";
import type { ActivityLogItem, ActivityLogParams } from "../types/activity";

type PaginationResponse<T> = {
  items?: T[];
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
};

const mockLogs: ActivityLogItem[] = [
  {
    id: "LOG-001",
    userId: "USR-MANAGER-001",
    action: "LOGIN",
    module: "AUTH",
    description: "Manager login ke sistem",
    createdAt: new Date().toISOString(),
    user: { id: "USR-MANAGER-001", name: "Manager Beard Papa's", email: "manager@beardpapas.id", role: "MANAGER" },
  },
  {
    id: "LOG-002",
    userId: "USR-STAFF-001",
    action: "CREATE",
    module: "PRODUCTION",
    description: "Mencatat produksi Roti Coklat sebanyak 50 pcs",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    user: { id: "USR-STAFF-001", name: "Staff Produksi", email: "staff@beardpapas.id", role: "STAFF" },
  },
  {
    id: "LOG-003",
    userId: "USR-KASIR-001",
    action: "STATUS_CHANGE",
    module: "TRANSACTION",
    description: "Mengubah status pesanan menjadi READY",
    createdAt: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    user: { id: "USR-KASIR-001", name: "Kasir Toko", email: "kasir@beardpapas.id", role: "KASIR" },
  },
];

const pageItems = <T>(payload: PaginationResponse<T> | T[]): T[] => {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.items) ? payload.items : [];
};

export async function getActivityLogs(params?: ActivityLogParams): Promise<ActivityLogItem[]> {
  try {
    const { data } = await api.get<PaginationResponse<ActivityLogItem>>("/activity-logs", {
      params: { limit: 100, ...(params ?? {}) },
    });
    const rows = pageItems(data);
    return rows.length ? rows : mockLogs;
  } catch {
    return mockLogs;
  }
}

export async function getActivityLogDetail(id: string): Promise<ActivityLogItem> {
  try {
    const { data } = await api.get<ActivityLogItem>(`/activity-logs/${id}`);
    return data;
  } catch {
    const log = mockLogs.find((item) => item.id === id);
    if (!log) throw new Error("Activity log tidak ditemukan");
    return log;
  }
}
