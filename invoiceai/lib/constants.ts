export const DEFAULT_CURRENCY = "AED" as const;

// Currencies the invoice builder can be extended to support later.
// Only DEFAULT_CURRENCY is wired up in the MVP; the rest exist so
// components/forms can already be built against a real union type.
export const SUPPORTED_CURRENCIES = ["AED", "SAR", "USD", "EUR", "GBP"] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const QUOTE_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceAed: 0,
    monthlyInvoiceLimit: 5,
    aiAssistant: false,
    quotes: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceAed: 29,
    monthlyInvoiceLimit: 100,
    aiAssistant: false,
    quotes: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceAed: 59,
    monthlyInvoiceLimit: null, // unlimited
    aiAssistant: true,
    quotes: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
