import api from "./api";
import type { ActivityLogItem, ActivityLogParams } from "../types/activity";

type PaginationResponse<T> = {
  items?: T[];
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
};

const pageItems = <T>(payload: PaginationResponse<T> | T[]): T[] => {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.items) ? payload.items : [];
};

export async function getActivityLogs(params?: ActivityLogParams): Promise<ActivityLogItem[]> {
  const { data } = await api.get<PaginationResponse<ActivityLogItem>>("/activity-logs", {
    params: { limit: 100, ...(params ?? {}) },
  });
  return pageItems(data);
}

export async function getActivityLogDetail(id: string): Promise<ActivityLogItem> {
  const { data } = await api.get<ActivityLogItem>(`/activity-logs/${id}`);
  return data;
}
