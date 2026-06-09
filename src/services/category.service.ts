import api from "./api";

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryPayload = {
  name: string;
  description?: string;
};

export type PaginationMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
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

export async function listCategories(params?: { page?: number; limit?: number }) {
  const { data } = await api.get<PaginationResponse<Category>>("/categories", { params });
  return {
    items: pageItems(data),
    meta: Array.isArray(data) ? undefined : data.meta,
  };
}

export async function getCategory(id: string) {
  const { data } = await api.get<Category>(`/categories/${id}`);
  return data;
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await api.post<Category>("/categories", {
    name: payload.name,
    description: payload.description || undefined,
  });
  return data;
}

export async function updateCategory(id: string, payload: Partial<CategoryPayload>) {
  const { data } = await api.patch<Category>(`/categories/${id}`, {
    name: payload.name,
    description: payload.description || undefined,
  });
  return data;
}

export async function deleteCategory(id: string) {
  await api.delete(`/categories/${id}`);
  return { id };
}
