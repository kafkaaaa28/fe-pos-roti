import api from "./api";
import type { StaffDashboardData, StaffPeriod } from "../types/staff";
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

type BackendDashboardSummary = {
  summary?: {
    totalProduction?: number;
    activeRecipes?: number;
    stockMovementsToday?: number;
    pendingProduction?: number;
    completedProduction?: number;
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

function emptyStaffDashboard(period: StaffPeriod): StaffDashboardData {
  return {
    period,
    summary: {
      todayProduction: 0,
      activeRecipes: 0,
      materialAlerts: 0,
      stockMovementsToday: 0,
      pendingProduction: 0,
      completedProduction: 0,
    },
    productionTrend: [],
    productionByProduct: [],
    recentProductions: [],
    materialAlerts: [],
    recipeOverviews: [],
    stockMovements: [],
    productionQueue: [],
  };
}

function adaptBackendSummary(payload: BackendDashboardSummary, period: StaffPeriod): StaffDashboardData {
  const empty = emptyStaffDashboard(period);
  const lowItems = payload.lowStock?.items ?? [];

  return {
    ...empty,
    summary: {
      ...empty.summary,
      todayProduction: Number(payload.summary?.totalProduction ?? 0),
      activeRecipes: Number(payload.summary?.activeRecipes ?? 0),
      stockMovementsToday: Number(payload.summary?.stockMovementsToday ?? 0),
      pendingProduction: Number(payload.summary?.pendingProduction ?? 0),
      completedProduction: Number(payload.summary?.completedProduction ?? 0),
      materialAlerts: Number(payload.lowStock?.total ?? lowItems.length),
    },
    materialAlerts: lowItems.map((item) => ({
      id: item.id ?? item.name ?? "MAT",
      name: item.name ?? "Bahan Baku",
      stock: Number(item.stock ?? 0),
      minStock: Number(item.minStock ?? 0),
      unit: item.unit ?? "unit",
      status: item.stockStatus ?? "MENIPIS",
      suggestedAction: "Cek stok dan lakukan restock bila diperlukan.",
    })),
  };
}

export async function getStaffDashboard(period: StaffPeriod): Promise<StaffDashboardData> {
  const response = await api.get<BackendDashboardSummary>("/dashboard/staff", { params: { period } });
  return adaptBackendSummary(response.data, period);
}

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
    itemType: "PRODUCT" | "MATERIAL";
    itemId: string;
    type: StockMovementType;
    quantity: number | string;
    description?: string | null;
    unit?: string | null;
    sourceModule?: "MATERIAL" | "PRODUCTION" | "POS" | "ONLINE_ORDER" | "ADJUSTMENT" | null;
    createdBy?: string | null;
    createdAt: string;
    product?: { name?: string | null } | null;
    material?: { name?: string | null; unit?: string | null } | null;
  }>("/stock-movements", {
    itemType: "MATERIAL",
    itemId: payload.materialId,
    type: payload.type,
    quantity: payload.quantity,
    description: payload.description,
    sourceModule: payload.type === "ADJUSTMENT" ? "ADJUSTMENT" : "MATERIAL",
    createdBy: "Staff",
  });

  const movement: ManagerStockMovement = {
    id: data.id,
    itemId: data.itemId,
    itemName: data.material?.name ?? "Bahan Baku",
    itemType: data.itemType,
    type: data.type,
    quantity: Number(data.quantity),
    unit: data.unit ?? data.material?.unit ?? "unit",
    description: data.description ?? payload.description,
    createdAt: data.createdAt,
    createdBy: data.createdBy ?? "Staff",
    sourceModule: data.sourceModule ?? (payload.type === "ADJUSTMENT" ? "ADJUSTMENT" : "MATERIAL"),
  };

  return makeStaffResponse("Stock movement berhasil disimpan ke backend", movement);
}
