import api from './api';
import type {
  ManagerInventoryItem,
  ManagerMaterial,
  ManagerProduct,
  ManagerProduction,
  ManagerRecipe,
  ManagerStockMovement,
  ManagerSystemUser,
  MaterialPayload,
  ProductPayload,
  RecipePayload,
  ServiceResponse,
  StockAdjustmentPayload,
  StockMovementType,
  UserPayload,
} from '../types/manager';

let products: ManagerProduct[] = [];
let materials: ManagerMaterial[] = [];
let recipes: ManagerRecipe[] = [];
let stockMovements: ManagerStockMovement[] = [];
let backendRecipeRows: BackendRecipe[] = [];

const nowIso = () => new Date().toISOString();
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

function makeResponse<T>(message: string, data: T): ServiceResponse<T> {
  return { success: true, message, data: clone(data) };
}

type BackendPagination<T> = { items?: T[]; data?: T[]; meta?: unknown };
type BackendProduct = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  price: number | string;
  stock: number | string;
  minStock: number | string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  category?: { name?: string | null } | null;
};
type BackendMaterial = {
  id: string;
  name: string;
  unit: string;
  stock: number | string;
  minStock: number | string;
  createdAt: string;
  updatedAt: string;
};
type BackendRecipe = {
  id: string;
  productId: string;
  materialId: string;
  quantity: number | string;
  product?: { id?: string; name?: string } | null;
  material?: { id?: string; name?: string; unit?: string } | null;
};
type BackendProduction = {
  id: string;
  productId: string;
  userId: string;
  quantity: number | string;
  notes?: string | null;
  createdAt: string;
  product?: { name?: string } | null;
  user?: { name?: string } | null;
};
type BackendStockMovement = {
  id: string;
  itemType: 'PRODUCT' | 'MATERIAL';
  itemId: string;
  itemName?: string;
  unit?: string;
  productId?: string | null;
  materialId?: string | null;
  type: StockMovementType;
  quantity: number | string;
  description?: string | null;
  sourceModule?: 'MATERIAL' | 'PRODUCTION' | 'POS' | 'ONLINE_ORDER' | 'ADJUSTMENT' | null;
  createdBy?: string | null;
  createdAt: string;
  product?: { name?: string } | null;
  material?: { name?: string; unit?: string } | null;
};
type BackendUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'MANAGER' | 'STAFF' | 'KASIR' | 'CUSTOMER';
  createdAt: string;
  updatedAt?: string;
};

function pageItems<T>(payload: BackendPagination<T> | T[]): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
}

function mapBackendProduct(item: BackendProduct): ManagerProduct {
  return {
    id: item.id,
    categoryId: item.categoryId,
    categoryName: item.category?.name ?? 'Kategori',
    name: item.name,
    description: item.description ?? '',
    image: item.image ?? undefined,
    price: Number(item.price),
    stock: Number(item.stock),
    minStock: Number(item.minStock),
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapBackendMaterial(item: BackendMaterial): ManagerMaterial {
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    stock: Number(item.stock),
    minStock: Number(item.minStock),
    supplierName: '-',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapBackendProduction(item: BackendProduction): ManagerProduction {
  return {
    id: item.id,
    productId: item.productId,
    productName: item.product?.name ?? 'Produk',
    userId: item.userId,
    userName: item.user?.name ?? 'Staff',
    quantity: Number(item.quantity),
    notes: item.notes ?? '',
    status: 'SELESAI',
    createdAt: item.createdAt,
  };
}

function mapBackendStockMovement(item: BackendStockMovement): ManagerStockMovement {
  const itemName =
    item.itemName ??
    (item.itemType === 'PRODUCT' ? item.product?.name : item.material?.name) ??
    (item.itemType === 'PRODUCT' ? 'Produk' : 'Bahan Baku');
  const unit =
    item.unit ??
    (item.itemType === 'PRODUCT' ? 'pcs' : item.material?.unit) ??
    'unit';

  return {
    id: item.id,
    itemId: item.itemId,
    itemName,
    itemType: item.itemType,
    type: item.type,
    quantity: Number(item.quantity),
    unit,
    description: item.description ?? `Mutasi stok ${itemName}`,
    createdAt: item.createdAt,
    createdBy: item.createdBy ?? 'Sistem',
    sourceModule:
      item.sourceModule ??
      (item.type === 'ADJUSTMENT'
        ? 'ADJUSTMENT'
        : item.itemType === 'PRODUCT'
          ? 'POS'
          : 'MATERIAL'),
  };
}

function mapBackendUser(item: BackendUser): ManagerSystemUser | null {
  if (item.role === 'CUSTOMER') return null;
  return {
    id: item.id,
    name: item.name,
    email: item.email,
    phone: item.phone ?? '',
    role: item.role,
    status: 'ACTIVE',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? item.createdAt,
  };
}

function groupBackendRecipes(items: BackendRecipe[]): ManagerRecipe[] {
  const grouped = new Map<string, ManagerRecipe>();

  for (const item of items) {
    const productId = item.productId;
    const productName = item.product?.name ?? 'Produk';
    const existing = grouped.get(productId);
    const line = {
      materialId: item.materialId,
      materialName: item.material?.name ?? 'Bahan',
      quantity: Number(item.quantity),
      unit: item.material?.unit ?? 'unit',
    };

    if (!existing) {
      grouped.set(productId, {
        id: item.id,
        productId,
        productName,
        materials: [line],
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    } else {
      existing.materials.push(line);
    }
  }

  return Array.from(grouped.values());
}

export function getInventoryStatus(stock: number, minStock: number) {
  if (stock <= 0) return 'HABIS' as const;
  if (stock <= minStock) return 'MENIPIS' as const;
  return 'AMAN' as const;
}

export function buildInventory(): ManagerInventoryItem[] {
  const productInventory = products.map<ManagerInventoryItem>((item) => ({
    id: `INV-${item.id}`,
    itemId: item.id,
    itemName: item.name,
    itemType: 'PRODUCT',
    stock: item.stock,
    unit: 'pcs',
    minStock: item.minStock,
    status: getInventoryStatus(item.stock, item.minStock),
    updatedAt: item.updatedAt,
  }));

  const materialInventory = materials.map<ManagerInventoryItem>((item) => ({
    id: `INV-${item.id}`,
    itemId: item.id,
    itemName: item.name,
    itemType: 'MATERIAL',
    stock: item.stock,
    unit: item.unit,
    minStock: item.minStock,
    status: getInventoryStatus(item.stock, item.minStock),
    updatedAt: item.updatedAt,
  }));

  return [...productInventory, ...materialInventory];
}

export async function listManagerProducts() {
  const { data } = await api.get<BackendPagination<BackendProduct>>('/products', { params: { limit: 100 } });
  const mapped = pageItems(data).map(mapBackendProduct);
  products = mapped;
  return makeResponse('Produk berhasil dimuat dari backend', mapped);
}

export async function createManagerProduct(payload: ProductPayload) {
  const { data } = await api.post<BackendProduct>('/products', {
    name: payload.name,
    description: payload.description || undefined,
    image: payload.image,
    price: payload.price,
    stock: payload.stock,
    minStock: payload.minStock,
    status: payload.status,
    categoryId: payload.categoryId,
  });
  const created = mapBackendProduct(data);
  products = [created, ...products.filter((item) => item.id !== created.id)];
  return makeResponse('Produk berhasil ditambahkan', created);
}

export async function updateManagerProduct(id: string, payload: ProductPayload) {
  const { data } = await api.patch<BackendProduct>(`/products/${id}`, {
    name: payload.name,
    description: payload.description || undefined,
    image: payload.image,
    price: payload.price,
    stock: payload.stock,
    minStock: payload.minStock,
    status: payload.status,
    categoryId: payload.categoryId,
  });
  const updated = mapBackendProduct(data);
  products = products.map((item) => (item.id === id ? updated : item));
  return makeResponse('Produk berhasil diperbarui', updated);
}

export async function deleteManagerProduct(id: string) {
  await api.delete(`/products/${id}`);
  products = products.filter((item) => item.id !== id);
  recipes = recipes.filter((item) => item.productId !== id);
  return makeResponse('Produk berhasil dihapus', { id });
}

export async function listManagerMaterials() {
  const { data } = await api.get<BackendPagination<BackendMaterial>>('/materials', { params: { limit: 100 } });
  const mapped = pageItems(data).map(mapBackendMaterial);
  materials = mapped;
  return makeResponse('Bahan baku berhasil dimuat dari backend', mapped);
}

export async function createManagerMaterial(payload: MaterialPayload) {
  const { data } = await api.post<BackendMaterial>('/materials', {
    name: payload.name,
    unit: payload.unit,
    stock: payload.stock,
    minStock: payload.minStock,
  });
  const created = mapBackendMaterial(data);
  materials = [created, ...materials.filter((item) => item.id !== created.id)];
  return makeResponse('Bahan baku berhasil ditambahkan', created);
}

export async function updateManagerMaterial(id: string, payload: MaterialPayload) {
  const { data } = await api.patch<BackendMaterial>(`/materials/${id}`, {
    name: payload.name,
    unit: payload.unit,
    stock: payload.stock,
    minStock: payload.minStock,
  });
  const updated = mapBackendMaterial(data);
  materials = materials.map((item) => (item.id === id ? updated : item));
  return makeResponse('Bahan baku berhasil diperbarui', updated);
}

export async function deleteManagerMaterial(id: string) {
  await api.delete(`/materials/${id}`);
  materials = materials.filter((item) => item.id !== id);
  recipes = recipes.map((recipe) => ({ ...recipe, materials: recipe.materials.filter((line) => line.materialId !== id) }));
  return makeResponse('Bahan baku berhasil dihapus', { id });
}

export async function listManagerRecipes() {
  const { data } = await api.get<BackendPagination<BackendRecipe> | BackendRecipe[]>('/recipes');
  backendRecipeRows = pageItems(data);
  const mapped = groupBackendRecipes(backendRecipeRows);
  recipes = mapped;
  return makeResponse('Recipe/BOM berhasil dimuat dari backend', mapped);
}

export async function createManagerRecipe(payload: RecipePayload) {
  const createdRows = await Promise.all(
    payload.materials.map((line) =>
      api
        .post<BackendRecipe>('/recipes', {
          productId: payload.productId,
          materialId: line.materialId,
          quantity: line.quantity,
        })
        .then((res) => res.data),
    ),
  );
  backendRecipeRows = [...createdRows, ...backendRecipeRows.filter((row) => row.productId !== payload.productId)];
  const [created] = groupBackendRecipes(createdRows);
  const mapped: ManagerRecipe = created ?? {
    ...payload,
    id: payload.productId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  recipes = [mapped, ...recipes.filter((item) => item.productId !== mapped.productId)];
  return makeResponse('Recipe/BOM berhasil ditambahkan', mapped);
}

export async function updateManagerRecipe(id: string, payload: RecipePayload) {
  const existingRows = backendRecipeRows.length
    ? backendRecipeRows.filter((row) => row.productId === payload.productId)
    : pageItems((await api.get<BackendPagination<BackendRecipe> | BackendRecipe[]>('/recipes', { params: { productId: payload.productId } })).data);

  const existingByMaterial = new Map(existingRows.map((row) => [row.materialId, row]));
  const syncedRows: BackendRecipe[] = [];

  for (const line of payload.materials) {
    const existing = existingByMaterial.get(line.materialId);
    if (existing) {
      const { data } = await api.patch<BackendRecipe>(`/recipes/${existing.id}`, { quantity: line.quantity });
      syncedRows.push(data);
      existingByMaterial.delete(line.materialId);
    } else {
      const { data } = await api.post<BackendRecipe>('/recipes', {
        productId: payload.productId,
        materialId: line.materialId,
        quantity: line.quantity,
      });
      syncedRows.push(data);
    }
  }

  for (const deleted of existingByMaterial.values()) {
    await api.delete(`/recipes/${deleted.id}`);
  }

  backendRecipeRows = [...syncedRows, ...backendRecipeRows.filter((row) => row.productId !== payload.productId)];
  const [updated] = groupBackendRecipes(syncedRows);
  const mapped = updated ?? { ...payload, id, createdAt: nowIso(), updatedAt: nowIso() };
  recipes = recipes.map((item) => (item.id === id || item.productId === payload.productId ? mapped : item));
  if (!recipes.some((item) => item.productId === mapped.productId)) recipes = [mapped, ...recipes];
  return makeResponse('Recipe/BOM berhasil diperbarui dari backend', mapped);
}

export async function deleteManagerRecipe(id: string) {
  const target = recipes.find((item) => item.id === id);
  const rows = target ? backendRecipeRows.filter((row) => row.productId === target.productId) : backendRecipeRows.filter((row) => row.id === id);
  const rowsToDelete = rows.length ? rows : [{ id } as BackendRecipe];
  await Promise.all(rowsToDelete.map((row) => api.delete(`/recipes/${row.id}`)));
  if (target) backendRecipeRows = backendRecipeRows.filter((row) => row.productId !== target.productId);
  else backendRecipeRows = backendRecipeRows.filter((row) => row.id !== id);
  recipes = recipes.filter((item) => item.id !== id);
  return makeResponse('Recipe/BOM berhasil dihapus', { id });
}

export async function listManagerProductions() {
  const { data } = await api.get<BackendPagination<BackendProduction>>('/productions', { params: { limit: 100 } });
  return makeResponse('Riwayat produksi berhasil dimuat dari backend', pageItems(data).map(mapBackendProduction));
}

export async function listManagerInventory() {
  await Promise.all([listManagerProducts(), listManagerMaterials()]);
  return makeResponse('Inventory berhasil dimuat dari backend', buildInventory());
}

export async function createStockAdjustment(payload: StockAdjustmentPayload) {
  const inventoryItem = buildInventory().find((item) => item.itemId === payload.itemId && item.itemType === payload.itemType);
  if (!inventoryItem) {
    throw new Error('Item inventory tidak ditemukan');
  }

  const { data } = await api.post<BackendStockMovement>('/stock-movements', {
    itemType: payload.itemType,
    itemId: payload.itemId,
    type: payload.type,
    quantity: payload.quantity,
    description: payload.description || 'Penyesuaian stok dari halaman manager inventory.',
    sourceModule: 'ADJUSTMENT',
    createdBy: payload.createdBy || 'Manager',
  });
  const movement = mapBackendStockMovement(data);
  stockMovements = [movement, ...stockMovements.filter((item) => item.id !== movement.id)];
  return makeResponse('Stock adjustment berhasil disimpan', movement);
}

export async function listManagerStockMovements() {
  const { data } = await api.get<BackendPagination<BackendStockMovement>>('/stock-movements', { params: { limit: 100 } });
  const mapped = pageItems(data).map(mapBackendStockMovement);
  stockMovements = mapped;
  return makeResponse('Stock movement berhasil dimuat dari backend', mapped);
}

export async function listManagerUsers() {
  const { data } = await api.get<BackendPagination<BackendUser>>('/users', { params: { limit: 100 } });
  const mapped = pageItems(data)
    .map(mapBackendUser)
    .filter((item): item is ManagerSystemUser => Boolean(item));
  return makeResponse('Data user berhasil dimuat dari backend', mapped);
}

export async function createManagerUser(payload: UserPayload) {
  const { data } = await api.post<BackendUser>('/users', {
    name: payload.name,
    email: payload.email,
    phone: payload.phone || undefined,
    password: payload.password,
    role: payload.role,
  });
  const created = mapBackendUser(data) ?? {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? payload.phone,
    role: data.role === 'CUSTOMER' ? 'STAFF' : data.role,
    status: 'ACTIVE',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt ?? data.createdAt,
  };
  return makeResponse('User berhasil ditambahkan dari backend', created);
}

export async function updateManagerUser(id: string, payload: UserPayload) {
  const body: Record<string, unknown> = {
    name: payload.name,
    email: payload.email,
    phone: payload.phone || undefined,
    role: payload.role,
  };
  if (payload.password) body.password = payload.password;
  const { data } = await api.patch<BackendUser>(`/users/${id}`, body);
  const updated = mapBackendUser(data) ?? {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? payload.phone,
    role: data.role === 'CUSTOMER' ? 'STAFF' : data.role,
    status: payload.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt ?? nowIso(),
  };
  return makeResponse('User berhasil diperbarui dari backend', updated);
}

export async function deleteManagerUser(id: string) {
  await api.delete(`/users/${id}`);
  return makeResponse('User berhasil dihapus', { id });
}
