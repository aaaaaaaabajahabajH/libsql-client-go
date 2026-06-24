import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/client";
import toast from "react-hot-toast";

export interface CartItem {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string;
  price: number;
  quantity: number;
  images: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  isLoading: boolean;
  // Actions
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      isLoading: false,

      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const res = await api.get<{ data: CartItem[]; total: number }>("/cart");
          set({ items: res.data.data ?? [], total: res.data.total ?? 0, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async (productId, quantity = 1) => {
        // Optimistic update: increment existing or append placeholder
        const prev = get().items;
        const existing = prev.find((i) => i.product_id === productId);
        if (existing) {
          set({
            items: prev.map((i) =>
              i.product_id === productId ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        }
        try {
          await api.post("/cart/items", { product_id: productId, quantity });
          await get().fetchCart();
          toast.success("تمت الإضافة للسلة");
        } catch {
          set({ items: prev }); // rollback
          toast.error("تعذّرت الإضافة");
        }
      },

      updateItem: async (itemId, quantity) => {
        const prev = get().items;
        if (quantity === 0) {
          set({ items: prev.filter((i) => i.id !== itemId) });
        } else {
          set({ items: prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)) });
        }
        try {
          await api.put(`/cart/items/${itemId}`, { quantity });
          await get().fetchCart();
        } catch {
          set({ items: prev });
          toast.error("تعذّر التحديث");
        }
      },

      removeItem: async (itemId) => {
        const prev = get().items;
        set({ items: prev.filter((i) => i.id !== itemId) });
        try {
          await api.delete(`/cart/items/${itemId}`);
          await get().fetchCart();
        } catch {
          set({ items: prev });
          toast.error("تعذّر الحذف");
        }
      },

      clear: async () => {
        set({ items: [], total: 0 });
        await api.delete("/cart").catch(() => null);
      },
    }),
    {
      name: "ghyari-cart",
      // Only persist items for guest experience; re-sync with server on mount
      partialize: (s) => ({ items: s.items, total: s.total }),
    }
  )
);
