"use client";

import posthog from "posthog-js";

export type AnalyticsEventMap = {
  signup: { method: "email" | "google" };
  login: { method: "email" | "google" };
  logout: Record<string, never>;
  ai_generation_started: { tool: string; credits_cost: number };
  ai_generation_completed: { tool: string; credits_cost: number; duration_ms: number };
  ai_generation_failed: { tool: string; error: string };
  subscription_upgrade_initiated: { plan: string; price: number; interval: "month" | "year" };
  subscription_upgraded: { plan: string; price: number };
  subscription_cancelled: { plan: string };
  billing_portal_opened: Record<string, never>;
  checkout_opened: { plan: string; price: number };
  feature_used: { tool: string };
  document_saved: { tool: string };
  document_downloaded: { tool: string; format: string };
  settings_updated: { section: string };
  notification_opened: { type: string };
  page_view: { path: string; title: string };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

export function trackEvent<K extends AnalyticsEventName>(
  name: K,
  properties: AnalyticsEventMap[K],
): void {
  if (typeof window === "undefined") return;

  // GA4
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", name, properties as Record<string, unknown>);
  }

  // PostHog
  try {
    posthog.capture(name, properties as Record<string, unknown>);
  } catch {
    // PostHog may not be initialized — fail silently
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  try {
    posthog.identify(userId, traits);
  } catch {
    // fail silently
  }
}

export function resetAnalytics(): void {
  if (typeof window === "undefined") return;

  try {
    posthog.reset();
  } catch {
    // fail silently
  }
}
