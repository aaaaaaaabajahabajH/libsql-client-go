import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// Attach auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ghyari_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const sessionId = getOrCreateSessionId();
  config.headers["X-Session-ID"] = sessionId;
  return config;
});

function getOrCreateSessionId(): string {
  let sid = sessionStorage.getItem("ghyari_session");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("ghyari_session", sid);
  }
  return sid;
}

export default api;

// ── Typed API helpers ──────────────────────────────────────────────────────

export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  sku: string;
  brand: string;
  car_brand: string;
  category_id: string;
  price: number;
  sale_price?: number;
  currency: string;
  stock: number;
  images: string[];
  model_3d_url?: string;
  rating: number;
  review_count: number;
  sold_count: number;
  is_tuning: boolean;
  is_performance: boolean;
  is_featured: boolean;
  distributor_id?: string;
}

export interface CarBrand {
  id: string;
  name_ar: string;
  name_en: string;
  is_popular: boolean;
}

export interface CarModel {
  id: string;
  brand_id: string;
  name_ar: string;
  name_en: string;
  year_from: number;
  year_to?: number;
  body_type: string;
  is_popular: boolean;
}

export interface Category {
  id: string;
  parent_id?: string;
  name_ar: string;
  name_en: string;
  slug: string;
}

export interface ProductsResponse {
  data: Product[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
}

export interface Distributor {
  id: string;
  name_ar: string;
  city: string;
  region: string;
  is_verified: boolean;
  rating: number;
}

// Products
export const fetchProducts = (params: Record<string, string | number | boolean>) =>
  api.get<ProductsResponse>("/products", { params }).then((r) => r.data);

export const fetchProduct = (id: string) =>
  api.get<{ data: Product }>(`/products/${id}`).then((r) => r.data.data);

export const searchProducts = (q: string, params?: Record<string, string>) =>
  api.get<{ data: Product[]; count: number }>("/products/search", { params: { q, ...params } }).then((r) => r.data);

export const fetchCompatibleProducts = (params: Record<string, string>) =>
  api.get<{ data: Product[] }>("/products/compatible", { params }).then((r) => r.data);

export const fetchPerformanceParts = (carBrand?: string) =>
  api.get<{ products: Product[] }>("/products/performance", { params: carBrand ? { car_brand: carBrand } : {} }).then((r) => r.data);

// Categories
export const fetchCategories = () =>
  api.get<{ categories: Category[] }>("/categories").then((r) => r.data.categories);

// Cars
export const fetchCarBrands = () =>
  api.get<{ brands: CarBrand[] }>("/cars").then((r) => r.data.brands);

export const fetchCarModels = (brandId: string) =>
  api.get<{ models: CarModel[] }>(`/cars/${brandId}/models`).then((r) => r.data.models);

// Distributors
export const fetchDistributors = () =>
  api.get<{ distributors: Distributor[] }>("/distributors").then((r) => r.data.distributors);

// AI Radar
export const submitDemandRequest = (payload: { query_raw: string; car_model_raw?: string; signal_type?: string }) =>
  api.post("/ai/requests", payload).catch(() => null); // silent fail
