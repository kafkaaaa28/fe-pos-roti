import api from "./api";
import { mockStaffDashboardByPeriod } from "../data/mockStaff";
import type { StaffDashboardData, StaffPeriod } from "../types/staff";

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

type BackendDashboardSummary = {
  summary?: {
    totalProduction?: number;
  };
  lowStock?: {
    total?: number;
    items?: Array<{
      id?: string;
      name?: string;
      stock?: number;
      minStock?: number;
      unit?: string;
      stockStatus?: "AMAN" | "MENIPIS" | "HABIS";
    }>;
  };
};

function adaptBackendSummary(payload: BackendDashboardSummary, period: StaffPeriod): StaffDashboardData {
  const fallback = mockStaffDashboardByPeriod[period];
  const lowItems = payload.lowStock?.items;

  return {
    ...fallback,
    summary: {
      ...fallback.summary,
      todayProduction: Number(payload.summary?.totalProduction ?? fallback.summary.todayProduction),
      materialAlerts: Number(payload.lowStock?.total ?? fallback.summary.materialAlerts),
    },
    materialAlerts: lowItems?.length
      ? lowItems.map((item) => ({
          id: item.id ?? item.name ?? "MAT",
          name: item.name ?? "Bahan Baku",
          stock: Number(item.stock ?? 0),
          minStock: Number(item.minStock ?? 0),
          unit: item.unit ?? "unit",
          status: item.stockStatus ?? "MENIPIS",
          suggestedAction: "Cek stok dan lakukan restock bila diperlukan.",
        }))
      : fallback.materialAlerts,
  };
}

export async function getStaffDashboard(period: StaffPeriod): Promise<StaffDashboardData> {
  try {
    const response = await api.get<BackendDashboardSummary>("/dashboard/staff", { params: { period } });
    return adaptBackendSummary(response.data, period);
  } catch {
    await wait(420);
    return mockStaffDashboardByPeriod[period];
  }
}

// Staff operational pages use the same backend contracts as Manager for master data,
// but the UI keeps Staff-specific responsibilities: materials, productions, recipes,
// inventory, and stock movement.
import {
  createManagerMaterial,
  deleteManagerMaterial,
  listManagerInventory,
  listManagerMaterials,
  listManagerProducts,
  listManagerProductions,
  listManagerRecipes,
  listManagerStockMovements,
  updateManagerMaterial,
} from "./manager.service";
import type {
  ManagerProduction,
  ManagerStockMovement,
  MaterialPayload,
  ServiceResponse,
  StockMovementType,
} from "../types/manager";

export const listStaffProducts = listManagerProducts;
export const listStaffMaterials = listManagerMaterials;
export const createStaffMaterial = createManagerMaterial;
export const updateStaffMaterial = updateManagerMaterial;
export const deleteStaffMaterial = deleteManagerMaterial;
export const listStaffRecipes = listManagerRecipes;
export const listStaffInventory = listManagerInventory;
export const listStaffStockMovements = listManagerStockMovements;
export type StaffMaterialPayload = MaterialPayload;

type BackendProductionCreate = {
  id: string;
  productId: string;
  userId: string;
  quantity: number;
  notes?: string | null;
  createdAt: string;
  product?: { name?: string | null } | null;
  user?: { name?: string | null } | null;
};

function makeStaffResponse<T>(message: string, data: T): ServiceResponse<T> {
  return { success: true, message, data };
}

function mapStaffProduction(item: BackendProductionCreate): ManagerProduction {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.product?.name ?? "Produk",
    userId: item.userId,
    userName: item.user?.name ?? "Staff",
    quantity: Number(item.quantity),
    notes: item.notes ?? "",
    status: "SELESAI",
    createdAt: item.createdAt,
  };
}

export async function listStaffProductions() {
  return listManagerProductions();
}

export async function createStaffProduction(payload: { productId: string; quantity: number; notes?: string }) {
  const { data } = await api.post<BackendProductionCreate>("/productions", {
    productId: payload.productId,
    quantity: payload.quantity,
    notes: payload.notes,
  });
  return makeStaffResponse("Produksi berhasil disimpan ke backend", mapStaffProduction(data));
}

export async function createStaffStockMovement(payload: {
  materialId: string;
  type: StockMovementType;
  quantity: number;
  description: string;
}) {
  const { data } = await api.post<{
    id: string;
    materialId: string;
    type: StockMovementType;
    quantity: number | string;
    description?: string | null;
    createdAt: string;
    material?: { name?: string | null; unit?: string | null } | null;
  }>("/stock-movements", payload);

  const movement: ManagerStockMovement = {
    id: data.id,
    itemId: data.materialId,
    itemName: data.material?.name ?? "Bahan Baku",
    itemType: "MATERIAL",
    type: data.type,
    quantity: Number(data.quantity),
    unit: data.material?.unit ?? "unit",
    description: data.description ?? payload.description,
    createdAt: data.createdAt,
    createdBy: "Staff",
    sourceModule: payload.type === "ADJUSTMENT" ? "ADJUSTMENT" : "MATERIAL",
  };

  return makeStaffResponse("Stock movement berhasil disimpan ke backend", movement);
}
