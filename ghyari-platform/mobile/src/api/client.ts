import * as SecureStore from "expo-secure-store";
import { Product, ProductsResponse, Category, CarBrand, CarModel } from "../types";

const BASE_URL = "https://api.ghyari.sa/api/v1";
const TOKEN_KEY = "ghyari_token";

async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

function qs(params: object): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

// ── Products ────────────────────────────────────────────────────────────────

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  car_brand?: string;
  car_model?: string;
  brand?: string;
  is_featured?: boolean;
  is_performance?: boolean;
  is_tuning?: boolean;
  sort?: string;
}

export const fetchProducts = (params: FetchProductsParams = {}) =>
  request<ProductsResponse>(`/products${qs(params)}`);

export const fetchProduct = (id: string) =>
  request<{ data: Product }>(`/products/${id}`).then((r) => r.data);

export interface SearchParams {
  q: string;
  car_brand?: string;
  car_model?: string;
  limit?: number;
}

export const searchProducts = (params: SearchParams) =>
  request<{ data: Product[]; count: number }>(`/products/search${qs(params)}`);

export const fetchCompatibleProducts = (params: {
  car_brand: string;
  car_model?: string;
  year?: string;
}) => request<{ data: Product[] }>(`/products/compatible${qs(params)}`);

export const fetchPerformanceParts = (car_brand?: string) =>
  request<{ products: Product[] }>(`/products/performance${car_brand ? `?car_brand=${car_brand}` : ""}`);

// ── Categories ──────────────────────────────────────────────────────────────

export const fetchCategories = () =>
  request<{ categories: Category[] }>("/categories").then((r) => r.categories);

// ── Cars ────────────────────────────────────────────────────────────────────

export const fetchCarBrands = () =>
  request<{ brands: CarBrand[] }>("/cars").then((r) => r.brands);

export const fetchCarModels = (brandId: string) =>
  request<{ models: CarModel[] }>(`/cars/${brandId}/models`).then((r) => r.models);

// ── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  user: { id: string; email: string; name: string; role: string };
  token: string;
}

export const login = (email: string, password: string) =>
  request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const register = (data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) =>
  request<LoginResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ── Cart ────────────────────────────────────────────────────────────────────

export const addToCart = (product_id: string, quantity = 1) =>
  request<{ message: string }>("/cart", {
    method: "POST",
    body: JSON.stringify({ product_id, quantity }),
  });

export const getCart = () =>
  request<{ items: Array<{ product: Product; quantity: number }> }>("/cart");

export const removeFromCart = (productId: string) =>
  request<{ message: string }>(`/cart/${productId}`, { method: "DELETE" });

// ── Orders ──────────────────────────────────────────────────────────────────

export const createOrder = (data: {
  shipping_address_ar?: string;
  notes_ar?: string;
}) =>
  request<{ order: { id: string; order_number: string; total: number } }>(
    "/orders",
    { method: "POST", body: JSON.stringify(data) }
  );

export const getOrders = () =>
  request<{ orders: Array<{ id: string; status: string; total: number; created_at: string; currency: string }> }>("/orders");

// ── AI Radar ────────────────────────────────────────────────────────────────

export const submitDemandSignal = (data: {
  query_raw: string;
  car_model_raw?: string;
  signal_type?: string;
}) =>
  request<{ message: string }>("/ai/requests", {
    method: "POST",
    body: JSON.stringify(data),
  }).catch(() => null);
