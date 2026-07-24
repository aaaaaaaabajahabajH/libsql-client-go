export interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  sku: string;
  brand: string;
  car_brand: string;
  category_id: string;
  sub_category?: string;
  price: number;
  sale_price?: number;
  currency: string;
  stock: number;
  low_stock_alert?: number;
  images: string[];
  model_3d_url?: string;
  rating: number;
  review_count: number;
  sold_count: number;
  view_count?: number;
  is_tuning: boolean;
  is_performance: boolean;
  is_oem?: boolean;
  is_featured: boolean;
  is_active?: boolean;
  distributor_id?: string;
  tags?: string[];
  compatibility?: string[];
  weight_kg?: number;
}

export interface Category {
  id: string;
  parent_id?: string;
  name_ar: string;
  name_en: string;
  slug: string;
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

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

export interface Order {
  id: string;
  order_number?: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  currency: string;
  created_at: string;
  items_count?: number;
}

export interface ProductsResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export type RootStackParamList = {
  Main: undefined;
  ProductDetail: { productId: string; productName: string };
  Checkout: undefined;
  OrderSuccess: { orderId: string };
  BarcodeScanner: undefined;
  Distributors: undefined;
  Wishlist: undefined;
  PaymentMethods: undefined;
};

export type TabParamList = {
  Home: undefined;
  Catalog: undefined;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

export interface Distributor {
  id: string;
  name_ar: string;
  name_en?: string;
  city: string;
  region: string;
  phone?: string;
  address?: string;
  is_verified: boolean;
  rating: number;
  logo_url?: string;
}
