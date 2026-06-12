export type ManagerPeriod = 'today' | 'week' | 'month' | 'year';

export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type InventoryStatus = 'AMAN' | 'MENIPIS' | 'HABIS';
export type InventoryItemType = 'PRODUCT' | 'MATERIAL';
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';
export type SystemRole = 'MANAGER' | 'STAFF' | 'KASIR';
export type SystemUserStatus = 'ACTIVE' | 'INACTIVE';
export type ProductionStatus = 'SELESAI' | 'DIPROSES' | 'DIBATALKAN';

export interface ManagerProduct {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  image?: string;
  price: number;
  stock: number;
  minStock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerMaterial {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  supplierName: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeMaterialLine {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
}

export interface ManagerRecipe {
  id: string;
  productId: string;
  productName: string;
  materials: RecipeMaterialLine[];
  createdAt: string;
  updatedAt: string;
}

export interface ManagerProduction {
  id: string;
  productId: string;
  productName: string;
  userId: string | null;
  userName: string;
  quantity: number;
  notes: string;
  status: ProductionStatus;
  createdAt: string;
}

export interface ManagerInventoryItem {
  id: string;
  itemId: string;
  itemName: string;
  itemType: InventoryItemType;
  stock: number;
  unit: string;
  minStock: number;
  status: InventoryStatus;
  updatedAt: string;
}

export interface ManagerStockMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemType: InventoryItemType;
  type: StockMovementType;
  quantity: number;
  unit: string;
  description: string;
  createdAt: string;
  createdBy: string;
  sourceModule: 'MATERIAL' | 'PRODUCTION' | 'POS' | 'ONLINE_ORDER' | 'ADJUSTMENT';
}

export interface ManagerSystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: SystemRole;
  status: SystemUserStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductPayload = Omit<ManagerProduct, 'id' | 'createdAt' | 'updatedAt'>;
export type MaterialPayload = Omit<ManagerMaterial, 'id' | 'createdAt' | 'updatedAt'>;
export type RecipePayload = Omit<ManagerRecipe, 'id' | 'createdAt' | 'updatedAt'>;
export type UserPayload = Omit<ManagerSystemUser, 'id' | 'createdAt' | 'updatedAt'> & { password?: string };

export interface StockAdjustmentPayload {
  itemId: string;
  itemType: InventoryItemType;
  type: StockMovementType;
  quantity: number;
  description: string;
  createdBy?: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
