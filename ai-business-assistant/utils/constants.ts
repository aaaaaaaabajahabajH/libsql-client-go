import {
  FileText,
  Globe,
  Mail,
  PenTool,
  Receipt,
  Share2,
} from "lucide-react";

import type { PlanConfig, ToolConfig } from "@/types";

/* ─── App metadata ──────────────────────────────────────────── */

export const APP_NAME = "AI Business Assistant";
export const APP_DESCRIPTION =
  "Supercharge your business with AI-powered content tools. Generate posts, emails, invoices, and more in seconds.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/* ─── Credit costs per tool ─────────────────────────────────── */

export const TOOL_CREDIT_COSTS = {
  "social-media": 5,
  "product-description": 5,
  "blog-writer": 10,
  "email-writer": 5,
  "invoice-generator": 3,
  translator: 3,
} as const satisfies Record<ToolConfig["id"], number>;

/* ─── Plan credit allocations ───────────────────────────────── */

export const PLAN_CREDITS = {
  free: 20,
  starter: 500,
  pro: 999_999,
  enterprise: 999_999,
} as const satisfies Record<PlanConfig["id"], number>;

/* ─── Plan history retention (days; null = unlimited) ───────── */

export const PLAN_HISTORY_DAYS: Record<PlanConfig["id"], number | null> = {
  free: 7,
  starter: 90,
  pro: null,
  enterprise: null,
};

/* ─── Tool configurations ───────────────────────────────────── */

export const TOOL_CONFIGS: ToolConfig[] = [
  {
    id: "social-media",
    label: "Social Media Generator",
    description: "Create viral posts for Twitter, LinkedIn, and Instagram.",
    icon: Share2,
    creditCost: TOOL_CREDIT_COSTS["social-media"],
    gradient: "from-pink-500 to-rose-500",
    badge: "Popular",
  },
  {
    id: "product-description",
    label: "Product Description",
    description: "Write compelling descriptions that convert browsers into buyers.",
    icon: FileText,
    creditCost: TOOL_CREDIT_COSTS["product-description"],
    gradient: "from-orange-500 to-amber-500",
  },
  {
    id: "blog-writer",
    label: "Blog Writer",
    description: "Produce SEO-optimized articles that rank and engage.",
    icon: PenTool,
    creditCost: TOOL_CREDIT_COSTS["blog-writer"],
    gradient: "from-violet-500 to-purple-500",
    badge: "New",
  },
  {
    id: "email-writer",
    label: "Email Writer",
    description: "Draft professional emails and campaigns in seconds.",
    icon: Mail,
    creditCost: TOOL_CREDIT_COSTS["email-writer"],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "invoice-generator",
    label: "Invoice Generator",
    description: "Generate professional invoices and business documents.",
    icon: Receipt,
    creditCost: TOOL_CREDIT_COSTS["invoice-generator"],
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    id: "translator",
    label: "Text Translator",
    description: "Translate into 50+ languages while preserving tone.",
    icon: Globe,
    creditCost: TOOL_CREDIT_COSTS["translator"],
    gradient: "from-indigo-500 to-blue-500",
  },
];

/* ─── Pricing plans ─────────────────────────────────────────── */

export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    description: "Perfect for exploring AI tools.",
    credits: PLAN_CREDITS.free,
    highlighted: false,
    features: [
      { text: "20 credits / month", included: true },
      { text: "All 6 AI tools", included: true },
      { text: "7-day history", included: true },
      { text: "Copy & download outputs", included: true },
      { text: "Save documents", included: false },
      { text: "Priority generation", included: false },
      { text: "API access", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 12,
    interval: "month",
    description: "For solopreneurs and small teams.",
    credits: PLAN_CREDITS.starter,
    highlighted: true,
    badge: "Most Popular",
    stripePriceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    features: [
      { text: "500 credits / month", included: true },
      { text: "All 6 AI tools", included: true },
      { text: "90-day history", included: true },
      { text: "Copy & download outputs", included: true },
      { text: "Save documents", included: true },
      { text: "Priority generation", included: true },
      { text: "API access", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 25,
    interval: "month",
    description: "For growing businesses and agencies.",
    credits: PLAN_CREDITS.pro,
    highlighted: false,
    stripePriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    features: [
      { text: "Unlimited credits / month", included: true },
      { text: "All 6 AI tools", included: true },
      { text: "Unlimited history", included: true },
      { text: "Copy & download outputs", included: true },
      { text: "Save documents", included: true },
      { text: "Priority generation", included: true },
      { text: "API access", included: true },
    ],
  },
];

/* ─── Routes ────────────────────────────────────────────────── */

export const PROTECTED_ROUTES = ["/dashboard", "/profile", "/settings", "/admin"];
export const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
export const PUBLIC_ROUTES = ["/", "/pricing"];
