import { create } from "zustand";
import { CartItem, Product, User } from "../types";
import { saveToken, clearToken } from "../api/client";

interface AppStore {
  // ── Auth ──────────────────────────────────────────────────────────────
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;

  // ── Cart ──────────────────────────────────────────────────────────────
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // ── Car filter ────────────────────────────────────────────────────────
  selectedCarBrand: string | null;
  selectedCarBrandName: string | null;
  selectedCarModel: string | null;
  selectedCarModelName: string | null;
  setCarFilter: (
    brandId: string | null,
    brandName: string | null,
    modelId: string | null,
    modelName: string | null
  ) => void;

  // ── Language ──────────────────────────────────────────────────────────
  language: "ar" | "en";
  setLanguage: (lang: "ar" | "en") => void;

  // ── Wishlist ──────────────────────────────────────────────────────────
  wishlist: Product[];
  wishlistIds: Set<string>;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;

  // ── Payment method ────────────────────────────────────────────────────
  paymentMethod: "cod" | "mada" | "stc_pay" | "apple_pay";
  setPaymentMethod: (m: "cod" | "mada" | "stc_pay" | "apple_pay") => void;
}

function calcTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
}

export const useStore = create<AppStore>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────
  user: null,
  isLoggedIn: false,

  setAuth: async (user, token) => {
    await saveToken(token);
    set({ user, isLoggedIn: true });
  },

  logout: async () => {
    await clearToken();
    set({ user: null, isLoggedIn: false, cartItems: [], cartCount: 0, cartTotal: 0 });
  },

  // ── Cart ──────────────────────────────────────────────────────────────
  cartItems: [],
  cartCount: 0,
  cartTotal: 0,

  addToCart: (product, quantity = 1) => {
    const items = [...get().cartItems];
    const idx = items.findIndex((i) => i.product.id === product.id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
    } else {
      items.push({ product, quantity });
    }
    set({ cartItems: items, cartCount: items.reduce((s, i) => s + i.quantity, 0), cartTotal: calcTotal(items) });
  },

  removeFromCart: (productId) => {
    const items = get().cartItems.filter((i) => i.product.id !== productId);
    set({ cartItems: items, cartCount: items.reduce((s, i) => s + i.quantity, 0), cartTotal: calcTotal(items) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const items = get().cartItems.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    set({ cartItems: items, cartCount: items.reduce((s, i) => s + i.quantity, 0), cartTotal: calcTotal(items) });
  },

  clearCart: () => set({ cartItems: [], cartCount: 0, cartTotal: 0 }),

  // ── Car filter ────────────────────────────────────────────────────────
  selectedCarBrand: null,
  selectedCarBrandName: null,
  selectedCarModel: null,
  selectedCarModelName: null,

  setCarFilter: (brandId, brandName, modelId, modelName) =>
    set({
      selectedCarBrand: brandId,
      selectedCarBrandName: brandName,
      selectedCarModel: modelId,
      selectedCarModelName: modelName,
    }),

  // ── Language ──────────────────────────────────────────────────────────
  language: "ar",
  setLanguage: (lang) => set({ language: lang }),

  // ── Wishlist ──────────────────────────────────────────────────────────
  wishlist: [],
  wishlistIds: new Set<string>(),
  toggleWishlist: (product) => {
    const ids = new Set(get().wishlistIds);
    let list = [...get().wishlist];
    if (ids.has(product.id)) {
      ids.delete(product.id);
      list = list.filter((p) => p.id !== product.id);
    } else {
      ids.add(product.id);
      list = [product, ...list];
    }
    set({ wishlist: list, wishlistIds: ids });
  },
  isInWishlist: (productId) => get().wishlistIds.has(productId),
  clearWishlist: () => set({ wishlist: [], wishlistIds: new Set() }),

  // ── Payment method ────────────────────────────────────────────────────
  paymentMethod: "cod",
  setPaymentMethod: (m) => set({ paymentMethod: m }),
}));
