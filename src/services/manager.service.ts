import api from './api';
import { managerMaterialsMock, managerProductionsMock, managerProductsMock, managerRecipesMock, managerStockMovementsMock, managerUsersMock } from '../data/mockManager';
import type {
  InventoryItemType,
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

let products = [...managerProductsMock];
let materials = [...managerMaterialsMock];
let recipes = [...managerRecipesMock];
let productions = [...managerProductionsMock];
let stockMovements = [...managerStockMovementsMock];
let users = [...managerUsersMock];
let backendRecipeRows: BackendRecipe[] = [];

const wait = (ms = 240) => new Promise((resolve) => window.setTimeout(resolve, ms));
const nowIso = () => new Date().toISOString();
const clone = <T>(data: T): T => JSON.parse(JSON.stringify(data));

function makeResponse<T>(message: string, data: T): ServiceResponse<T> {
  return { success: true, message, data: clone(data) };
}

type BackendPagination<T> = { items?: T[]; meta?: unknown };
type BackendProduct = {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  price: number;
  stock: number;
  minStock: number;
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
  quantity: number;
  notes?: string | null;
  createdAt: string;
  product?: { name?: string } | null;
  user?: { name?: string } | null;
};
type BackendStockMovement = {
  id: string;
  materialId: string;
  type: StockMovementType;
  quantity: number | string;
  description?: string | null;
  createdAt: string;
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
  return Array.isArray(payload.items) ? payload.items : [];
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
  return {
    id: item.id,
    itemId: item.materialId,
    itemName: item.material?.name ?? 'Bahan Baku',
    itemType: 'MATERIAL',
    type: item.type,
    quantity: Number(item.quantity),
    unit: item.material?.unit ?? 'unit',
    description: item.description ?? 'Mutasi stok bahan baku',
    createdAt: item.createdAt,
    createdBy: 'Sistem',
    sourceModule: item.type === 'ADJUSTMENT' ? 'ADJUSTMENT' : 'MATERIAL',
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
        notes: 'Recipe/BOM dari backend',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });
    } else {
      existing.materials.push(line);
    }
  }

  return Array.from(grouped.values());
}

function nextCode(prefix: string, length: number) {
  return `${prefix}${String(length + 1).padStart(3, '0')}`;
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
  try {
    const { data } = await api.get<BackendPagination<BackendProduct>>('/products', { params: { limit: 100 } });
    const mapped = pageItems(data).map(mapBackendProduct);
    products = mapped;
    return makeResponse('Produk berhasil dimuat dari backend', mapped);
  } catch {
    await wait();
    return makeResponse('Produk berhasil dimuat', products);
  }
}

export async function createManagerProduct(payload: ProductPayload) {
  try {
    const { data } = await api.post<BackendProduct>('/products', {
      name: payload.name,
      description: payload.description,
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
  } catch {
    await wait();
    const created: ManagerProduct = {
      ...payload,
      id: nextCode('PRD', products.length),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    products = [created, ...products];
    return makeResponse('Produk berhasil ditambahkan', created);
  }
}

export async function updateManagerProduct(id: string, payload: ProductPayload) {
  try {
    const { data } = await api.patch<BackendProduct>(`/products/${id}`, {
      name: payload.name,
      description: payload.description,
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
  } catch {
    await wait();
    let updated: ManagerProduct | null = null;
    products = products.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...payload, updatedAt: nowIso() };
      return updated;
    });
    return makeResponse('Produk berhasil diperbarui', updated ?? products[0]);
  }
}

export async function deleteManagerProduct(id: string) {
  try {
    await api.delete(`/products/${id}`);
  } catch {
    await wait();
  }
  products = products.filter((item) => item.id !== id);
  recipes = recipes.filter((item) => item.productId !== id);
  return makeResponse('Produk berhasil dihapus', { id });
}

export async function listManagerMaterials() {
  try {
    const { data } = await api.get<BackendPagination<BackendMaterial>>('/materials', { params: { limit: 100 } });
    const mapped = pageItems(data).map(mapBackendMaterial);
    materials = mapped;
    return makeResponse('Bahan baku berhasil dimuat dari backend', mapped);
  } catch {
    await wait();
    return makeResponse('Bahan baku berhasil dimuat', materials);
  }
}

export async function createManagerMaterial(payload: MaterialPayload) {
  try {
    const { data } = await api.post<BackendMaterial>('/materials', {
      name: payload.name,
      unit: payload.unit,
      stock: payload.stock,
      minStock: payload.minStock,
    });
    const created = mapBackendMaterial(data);
    materials = [created, ...materials.filter((item) => item.id !== created.id)];
    return makeResponse('Bahan baku berhasil ditambahkan', created);
  } catch {
    await wait();
    const created: ManagerMaterial = {
      ...payload,
      id: nextCode('MAT', materials.length),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    materials = [created, ...materials];
    return makeResponse('Bahan baku berhasil ditambahkan', created);
  }
}

export async function updateManagerMaterial(id: string, payload: MaterialPayload) {
  try {
    const { data } = await api.patch<BackendMaterial>(`/materials/${id}`, {
      name: payload.name,
      unit: payload.unit,
      stock: payload.stock,
      minStock: payload.minStock,
    });
    const updated = mapBackendMaterial(data);
    materials = materials.map((item) => (item.id === id ? updated : item));
    return makeResponse('Bahan baku berhasil diperbarui', updated);
  } catch {
    await wait();
    let updated: ManagerMaterial | null = null;
    materials = materials.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...payload, updatedAt: nowIso() };
      return updated;
    });
    return makeResponse('Bahan baku berhasil diperbarui', updated ?? materials[0]);
  }
}

export async function deleteManagerMaterial(id: string) {
  try {
    await api.delete(`/materials/${id}`);
  } catch {
    await wait();
  }
  materials = materials.filter((item) => item.id !== id);
  recipes = recipes.map((recipe) => ({ ...recipe, materials: recipe.materials.filter((line) => line.materialId !== id) }));
  return makeResponse('Bahan baku berhasil dihapus', { id });
}

export async function listManagerRecipes() {
  try {
    const { data } = await api.get<BackendRecipe[]>('/recipes');
    backendRecipeRows = data;
    const mapped = groupBackendRecipes(data);
    recipes = mapped;
    return makeResponse('Recipe/BOM berhasil dimuat dari backend', mapped);
  } catch {
    await wait();
    return makeResponse('Recipe/BOM berhasil dimuat', recipes);
  }
}

export async function createManagerRecipe(payload: RecipePayload) {
  try {
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
      id: nextCode('RCP', recipes.length),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    recipes = [mapped, ...recipes.filter((item) => item.productId !== mapped.productId)];
    return makeResponse('Recipe/BOM berhasil ditambahkan', mapped);
  } catch {
    await wait();
    const created: ManagerRecipe = {
      ...payload,
      id: nextCode('RCP', recipes.length),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    recipes = [created, ...recipes];
    return makeResponse('Recipe/BOM berhasil ditambahkan', created);
  }
}

export async function updateManagerRecipe(id: string, payload: RecipePayload) {
  try {
    const existingRows = backendRecipeRows.length ? backendRecipeRows.filter((row) => row.productId === payload.productId) : (await api.get<BackendRecipe[]>('/recipes', { params: { productId: payload.productId } })).data;

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
  } catch {
    await wait();
    let updated: ManagerRecipe | null = null;
    recipes = recipes.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...payload, updatedAt: nowIso() };
      return updated;
    });
    return makeResponse('Recipe/BOM berhasil diperbarui', updated ?? recipes[0]);
  }
}

export async function deleteManagerRecipe(id: string) {
  const target = recipes.find((item) => item.id === id);
  try {
    const rows = target ? backendRecipeRows.filter((row) => row.productId === target.productId) : backendRecipeRows.filter((row) => row.id === id);
    const rowsToDelete = rows.length ? rows : [{ id } as BackendRecipe];
    await Promise.all(rowsToDelete.map((row) => api.delete(`/recipes/${row.id}`)));
    if (target) backendRecipeRows = backendRecipeRows.filter((row) => row.productId !== target.productId);
    else backendRecipeRows = backendRecipeRows.filter((row) => row.id !== id);
  } catch {
    await wait();
  }
  recipes = recipes.filter((item) => item.id !== id);
  return makeResponse('Recipe/BOM berhasil dihapus', { id });
}

export async function listManagerProductions() {
  try {
    const { data } = await api.get<BackendPagination<BackendProduction>>('/productions', { params: { limit: 100 } });
    const mapped = pageItems(data).map(mapBackendProduction);
    productions = mapped;
    return makeResponse('Riwayat produksi berhasil dimuat dari backend', mapped);
  } catch {
    await wait();
    return makeResponse('Riwayat produksi berhasil dimuat', productions);
  }
}

export async function listManagerInventory() {
  try {
    await Promise.all([listManagerProducts(), listManagerMaterials()]);
    return makeResponse('Inventory berhasil dimuat dari backend', buildInventory());
  } catch {
    await wait();
    return makeResponse('Inventory berhasil dimuat', buildInventory());
  }
}

function updateStock(itemType: InventoryItemType, itemId: string, type: StockMovementType, quantity: number) {
  const apply = (stock: number) => {
    if (type === 'OUT') return Math.max(0, stock - quantity);
    if (type === 'IN') return stock + quantity;
    return quantity;
  };

  if (itemType === 'PRODUCT') {
    products = products.map((item) => (item.id === itemId ? { ...item, stock: apply(item.stock), updatedAt: nowIso() } : item));
  } else {
    materials = materials.map((item) => (item.id === itemId ? { ...item, stock: apply(item.stock), updatedAt: nowIso() } : item));
  }
}

export async function createStockAdjustment(payload: StockAdjustmentPayload) {
  const inventoryItem = buildInventory().find((item) => item.itemId === payload.itemId && item.itemType === payload.itemType);
  if (!inventoryItem) {
    throw new Error('Item inventory tidak ditemukan');
  }

  if (payload.itemType === 'MATERIAL') {
    try {
      const { data } = await api.post<BackendStockMovement>('/stock-movements', {
        materialId: payload.itemId,
        type: payload.type,
        quantity: payload.quantity,
        description: payload.description || 'Penyesuaian stok dari halaman manager inventory.',
      });
      const movement = mapBackendStockMovement(data);
      stockMovements = [movement, ...stockMovements.filter((item) => item.id !== movement.id)];
      return makeResponse('Stock adjustment berhasil disimpan', movement);
    } catch {
      // fallback lokal di bawah
    }
  }

  await wait();
  updateStock(payload.itemType, payload.itemId, payload.type, payload.quantity);

  const movement: ManagerStockMovement = {
    id: nextCode('SM', stockMovements.length),
    itemId: payload.itemId,
    itemName: inventoryItem.itemName,
    itemType: payload.itemType,
    type: payload.type,
    quantity: payload.quantity,
    unit: inventoryItem.unit,
    description: payload.description || 'Penyesuaian stok dari halaman manager inventory.',
    createdAt: nowIso(),
    createdBy: payload.createdBy || 'Manager',
    sourceModule: 'ADJUSTMENT',
  };
  stockMovements = [movement, ...stockMovements];
  return makeResponse('Stock adjustment berhasil disimpan', movement);
}

export async function listManagerStockMovements() {
  try {
    const { data } = await api.get<BackendPagination<BackendStockMovement>>('/stock-movements', { params: { limit: 100 } });
    const mapped = pageItems(data).map(mapBackendStockMovement);
    stockMovements = mapped;
    return makeResponse('Stock movement berhasil dimuat dari backend', mapped);
  } catch {
    await wait();
    return makeResponse('Stock movement berhasil dimuat', stockMovements);
  }
}

export async function listManagerUsers() {
  try {
    const { data } = await api.get<BackendPagination<BackendUser>>('/users', { params: { limit: 100 } });
    const mapped = pageItems(data)
      .map(mapBackendUser)
      .filter((item): item is ManagerSystemUser => Boolean(item));
    users = mapped;
    return makeResponse('Data user berhasil dimuat dari backend', mapped);
  } catch {
    await wait();
    return makeResponse('Data user berhasil dimuat', users);
  }
}

export async function createManagerUser(payload: UserPayload) {
  try {
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
    users = [created, ...users.filter((item) => item.id !== created.id)];
    return makeResponse('User berhasil ditambahkan dari backend', created);
  } catch {
    await wait();
    const created: ManagerSystemUser = {
      id: nextCode('USR', users.length),
      name: payload.name,
      email: payload.email,
      phone: payload.phone || undefined,
      role: payload.role,
      status: payload.status,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    users = [created, ...users];
    return makeResponse('User berhasil ditambahkan', created);
  }
}

export async function updateManagerUser(id: string, payload: UserPayload) {
  try {
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
    users = users.map((item) => (item.id === id ? updated : item));
    return makeResponse('User berhasil diperbarui dari backend', updated);
  } catch {
    await wait();
    let updated: ManagerSystemUser | null = null;
    users = users.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, name: payload.name, email: payload.email, phone: payload.phone, role: payload.role, status: payload.status, updatedAt: nowIso() };
      return updated;
    });
    return makeResponse('User berhasil diperbarui', updated ?? users[0]);
  }
}

export async function deleteManagerUser(id: string) {
  try {
    await api.delete(`/users/${id}`);
  } catch {
    await wait();
  }
  users = users.filter((item) => item.id !== id);
  return makeResponse('User berhasil dihapus', { id });
}
