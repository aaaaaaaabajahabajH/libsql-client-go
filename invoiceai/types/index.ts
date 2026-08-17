import type { Currency, InvoiceStatus, PlanId, QuoteStatus } from "@/lib/constants";

// Hand-written domain types for the scaffolding phase. Once the Supabase
// schema exists (see supabase/migrations), these should be superseded by
// `supabase gen types typescript` output in types/database.ts and re-exported
// from here so the rest of the app keeps importing from "@/types".

export interface Company {
  id: string;
  userId: string;
  name: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  address: string | null;
  taxNumber: string | null;
  notes: string | null;
  createdAt: string;
}

export interface LineItem {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export interface Invoice {
  id: string;
  userId: string;
  customerId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: Currency;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  userId: string;
  customerId: string;
  quoteNumber: string;
  status: QuoteStatus;
  currency: Currency;
  issueDate: string;
  expiryDate: string;
  items: LineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  convertedInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: PlanId;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
}

export interface UsageRecord {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  invoicesCreated: number;
}
