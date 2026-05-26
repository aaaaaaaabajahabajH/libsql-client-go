/**
 * Web Vitals measurement — reports Core Web Vitals to the backend
 * and to the browser console in dev mode.
 *
 * Metrics tracked:
 *   CLS  — Cumulative Layout Shift       (target < 0.1)
 *   FID  — First Input Delay             (target < 100ms)
 *   INP  — Interaction to Next Paint     (target < 200ms)
 *   LCP  — Largest Contentful Paint      (target < 2500ms)
 *   FCP  — First Contentful Paint        (target < 1800ms)
 *   TTFB — Time to First Byte            (target < 800ms)
 */

interface VitalsPayload {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  page: string;
}

const SLA: Record<string, [number, number]> = {
  CLS:  [0.1,   0.25],
  FID:  [100,   300],
  INP:  [200,   500],
  LCP:  [2500,  4000],
  FCP:  [1800,  3000],
  TTFB: [800,   1800],
};

function getRating(name: string, value: number): VitalsPayload["rating"] {
  const thresholds = SLA[name];
  if (!thresholds) return "good";
  if (value <= thresholds[0]) return "good";
  if (value <= thresholds[1]) return "needs-improvement";
  return "poor";
}

function report(metric: { name: string; value: number; delta: number; id: string }) {
  const payload: VitalsPayload = {
    name:   metric.name,
    value:  Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    rating: getRating(metric.name, metric.value),
    delta:  Math.round(metric.delta),
    id:     metric.id,
    page:   window.location.pathname,
  };

  // Dev: pretty console output
  if (import.meta.env.DEV) {
    const emoji = { good: "✅", "needs-improvement": "⚠️", poor: "❌" }[payload.rating];
    console.info(
      `[Web Vitals] ${emoji} ${payload.name}: ${payload.value}${payload.name === "CLS" ? " (×1000)" : "ms"} — ${payload.rating}`,
    );
  }

  // Send to backend analytics (fire-and-forget)
  if (import.meta.env.VITE_API_URL) {
    navigator.sendBeacon(
      `${import.meta.env.VITE_API_URL}/analytics/vitals`,
      JSON.stringify(payload),
    );
  }

  // Also push to dataLayer for GTM/GA4 if present
  if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).dataLayer) {
    ((window as unknown as Record<string, unknown>).dataLayer as unknown[]).push({
      event: "web_vitals",
      metric_name: payload.name,
      metric_value: payload.value,
      metric_rating: payload.rating,
    });
  }
}

/**
 * Initialize Web Vitals tracking. Call once at app startup.
 * Uses PerformanceObserver — no external library needed.
 */
export function initWebVitals() {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  // ── LCP ───────────────────────────────────────────────────────────────────
  let lcpValue = 0;
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
    lcpValue = last.startTime;
  });
  lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

  // ── FCP ───────────────────────────────────────────────────────────────────
  const fcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntriesByName("first-contentful-paint")) {
      report({ name: "FCP", value: entry.startTime, delta: entry.startTime, id: "fcp-1" });
      fcpObserver.disconnect();
    }
  });
  fcpObserver.observe({ type: "paint", buffered: true });

  // ── CLS ───────────────────────────────────────────────────────────────────
  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
      if (!shift.hadRecentInput) {
        clsValue += shift.value;
        clsEntries.push(entry);
      }
    }
  });
  clsObserver.observe({ type: "layout-shift", buffered: true });

  // ── FID / INP ─────────────────────────────────────────────────────────────
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const e = entry as PerformanceEntry & { processingStart: number; duration: number };
      report({
        name: "FID",
        value: e.processingStart - e.startTime,
        delta: e.processingStart - e.startTime,
        id: "fid-1",
      });
      fidObserver.disconnect();
    }
  });
  try { fidObserver.observe({ type: "first-input", buffered: true }); } catch { /* not supported */ }

  // ── TTFB ──────────────────────────────────────────────────────────────────
  const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  if (navEntries.length > 0) {
    const nav = navEntries[0];
    report({ name: "TTFB", value: nav.responseStart, delta: nav.responseStart, id: "ttfb-1" });
  }

  // ── Flush on page hide ────────────────────────────────────────────────────
  const flush = () => {
    // LCP: finalize on page hide
    if (lcpValue > 0) {
      report({ name: "LCP", value: lcpValue, delta: lcpValue, id: "lcp-1" });
      lcpValue = 0;
    }
    // CLS: finalize on page hide
    if (clsEntries.length > 0) {
      report({ name: "CLS", value: clsValue, delta: clsValue, id: "cls-1" });
      clsEntries = [];
      clsValue = 0;
    }
    lcpObserver.disconnect();
    clsObserver.disconnect();
  };

  addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  addEventListener("pagehide", flush, { once: true });
}
