import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

type Item = {
  id: string;
  cartItemId?: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
};

type BackendCart = {
  id?: string;
  items?: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      image?: string | null;
      price: number | string;
    };
    subtotal?: number | string;
  }>;
  totalItems?: number;
  totalPrice?: number | string;
};

type CartCtx = {
  items: Item[];
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  syncCart: () => Promise<void>;
  total: number;
};

const CART_STORAGE_KEY = "beard-papas-customer-cart";
const LEGACY_CART_STORAGE_KEY = "bread-papa-customer-cart";
const CartContext = createContext<CartCtx | null>(null);

function readCartItems() {
  const raw = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem(LEGACY_CART_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as Item[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    return [];
  }
}

function mapBackendCart(cart: BackendCart): Item[] {
  return (cart.items ?? []).map((item) => ({
    id: item.product.id,
    cartItemId: item.id,
    name: item.product.name,
    price: Number(item.product.price || 0),
    qty: Number(item.quantity || 0),
    image: item.product.image || undefined,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [items, setItems] = useState<Item[]>(() => readCartItems());

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const syncCart = async () => {
    if (!user || !token) return;
    try {
      const { data } = await api.get<BackendCart>("/cart");
      setItems(mapBackendCart(data));
    } catch {
      // fallback local cart tetap dipakai agar FE bisa jalan saat BE belum aktif
    }
  };

  useEffect(() => {
    void syncCart();
  }, [user?.id, token]);

  const addItem = (item: Item) => {
    setItems((prev) => {
      const exist = prev.find((i) => i.id === item.id);

      if (exist) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + item.qty } : i
        );
      }

      return [...prev, item];
    });

    if (user && token) {
      void api
        .post<BackendCart>("/cart/items", { productId: item.id, quantity: item.qty })
        .then(({ data }) => setItems(mapBackendCart(data)))
        .catch(() => undefined);
    }
  };

  const removeItem = (id: string) => {
    const item = items.find((current) => current.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));

    if (user && token && item?.cartItemId) {
      void api
        .delete<BackendCart>(`/cart/items/${item.cartItemId}`)
        .then(({ data }) => setItems(mapBackendCart(data)))
        .catch(() => undefined);
    }
  };

  const updateQty = (id: string, qty: number) => {
    const nextQty = Math.max(1, qty);
    const item = items.find((current) => current.id === id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: nextQty } : i)));

    if (user && token && item?.cartItemId) {
      void api
        .patch<BackendCart>(`/cart/items/${item.cartItemId}`, { quantity: nextQty })
        .then(({ data }) => setItems(mapBackendCart(data)))
        .catch(() => undefined);
    }
  };

  const clear = () => {
    setItems([]);

    if (user && token) {
      void api.delete("/cart").catch(() => undefined);
    }
  };

  const total = useMemo(() => items.reduce((a, b) => a + b.price * b.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clear, syncCart, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider missing");
  return ctx;
};
