export type StaffPeriod = "today" | "week" | "month";
export type StaffStockStatus = "AMAN" | "MENIPIS" | "HABIS";
export type StaffProductionStatus = "SELESAI" | "DIPROSES" | "TERJADWAL";
export type StaffMovementType = "IN" | "OUT" | "ADJUSTMENT";

export interface StaffSummary {
  todayProduction: number;
  activeRecipes: number;
  materialAlerts: number;
  stockMovementsToday: number;
  pendingProduction: number;
  completedProduction: number;
}

export interface StaffProductionChartPoint {
  label: string;
  quantity: number;
}

export interface StaffProductionProductPoint {
  productName: string;
  quantity: number;
}

export interface StaffProductionRecord {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  staffName: string;
  status: StaffProductionStatus;
  notes: string;
  createdAt: string;
}

export interface StaffMaterialAlert {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  status: StaffStockStatus;
  suggestedAction: string;
}

export interface StaffRecipeOverview {
  id: string;
  productId: string;
  productName: string;
  materialCount: number;
  estimatedOutput: number;
  readiness: StaffStockStatus;
  note: string;
}

export interface StaffStockMovement {
  id: string;
  itemName: string;
  type: StaffMovementType;
  quantity: number;
  unit: string;
  description: string;
  createdAt: string;
}

export interface StaffProductionQueue {
  id: string;
  productName: string;
  targetQuantity: number;
  priority: "NORMAL" | "TINGGI";
  status: StaffProductionStatus;
  dueTime: string;
}

export interface StaffDashboardData {
  period: StaffPeriod;
  summary: StaffSummary;
  productionTrend: StaffProductionChartPoint[];
  productionByProduct: StaffProductionProductPoint[];
  recentProductions: StaffProductionRecord[];
  materialAlerts: StaffMaterialAlert[];
  recipeOverviews: StaffRecipeOverview[];
  stockMovements: StaffStockMovement[];
  productionQueue: StaffProductionQueue[];
}

export interface StaffServiceResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
