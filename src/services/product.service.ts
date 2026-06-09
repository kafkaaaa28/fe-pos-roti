import api from "./api";
import type { PublicProduct, PublicProductCategory } from "../data/publicProducts";

type BackendPagination<T> = { items?: T[]; meta?: unknown };

type BackendProduct = {
  id: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  image?: string | null;
  price: number | string;
  stock?: number | string;
  minStock?: number | string;
  stockStatus?: "AMAN" | "MENIPIS" | "HABIS";
  status?: "ACTIVE" | "INACTIVE";
  category?: { id?: string; name?: string | null; description?: string | null } | null;
};

function pageItems<T>(payload: BackendPagination<T> | T[]): T[] {
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.items) ? payload.items : [];
}

function inferCategory(product: BackendProduct): PublicProductCategory {
  const text = `${product.category?.name ?? ""} ${product.name ?? ""}`.toLowerCase();

  if (text.includes("dessert") || text.includes("cake") || text.includes("cheesecake") || text.includes("brulee")) {
    return "dessert";
  }

  if (text.includes("filling") || text.includes("filled") || text.includes("custard") || text.includes("isi")) {
    return "filling";
  }

  return "shell";
}

function categoryLabel(category: PublicProductCategory) {
  if (category === "shell") return "Choose Your Shell";
  if (category === "filling") return "Choose Your Filling";
  return "Desserts";
}

function mapBackendProduct(product: BackendProduct): PublicProduct {
  const category = inferCategory(product);
  const price = Number(product.price || 0);

  return {
    id: product.id,
    name: product.name,
    price,
    image: product.image || "",
    tag: product.stockStatus === "MENIPIS" ? "Stok Menipis" : product.stockStatus === "HABIS" ? "Habis" : "Fresh",
    desc: product.description || `${product.name} fresh dari Beard Papa's.`,
    category,
    categoryLabel: categoryLabel(category),
  };
}

export async function getPublicProducts(): Promise<PublicProduct[]> {
  const { data } = await api.get<BackendPagination<BackendProduct>>("/products", {
    params: { limit: 100, status: "ACTIVE" },
  });
  return pageItems(data).map(mapBackendProduct);
}
