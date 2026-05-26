/**
 * Ghyari API — k6 Load Test
 * Run: k6 run scripts/k6/load_test.js
 * Run with dashboard: K6_WEB_DASHBOARD=true k6 run scripts/k6/load_test.js
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ── Custom metrics ────────────────────────────────────────────────────────────
const errorRate       = new Rate("ghyari_error_rate");
const productLatency  = new Trend("ghyari_product_list_ms");
const searchLatency   = new Trend("ghyari_search_ms");
const healthLatency   = new Trend("ghyari_health_ms");
const notFoundSignals = new Counter("ghyari_ai_radar_signals");

// ── Test configuration ────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // 1. Warm-up ramp: 0 → 20 VUs over 30s
    warm_up: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "1m",  target: 20 },
      ],
      gracefulRampDown: "10s",
    },
    // 2. Peak load: constant 50 VUs for 2m
    peak: {
      executor: "constant-vus",
      vus: 50,
      duration: "2m",
      startTime: "1m30s",
    },
    // 3. Spike test: burst to 150 VUs for 15s
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 150 },
        { duration: "15s", target: 150 },
        { duration: "10s", target: 0 },
      ],
      startTime: "4m",
    },
  },
  thresholds: {
    // P95 latency < 500ms for product list
    "ghyari_product_list_ms": ["p(95)<500"],
    // P95 latency < 800ms for search (more expensive)
    "ghyari_search_ms":       ["p(95)<800"],
    // Health check < 50ms always
    "ghyari_health_ms":       ["p(99)<50"],
    // Error rate < 1%
    "ghyari_error_rate":      ["rate<0.01"],
    // Overall HTTP error rate < 1%
    "http_req_failed":        ["rate<0.01"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:8080";

const SEARCH_QUERIES = [
  "فلتر هواء",
  "بريكات باترول",
  "تزويد نيسان",
  "بطارية",
  "كاتم صوت",
  "مكابح برمبو",
  "عدة تعليق",
  "مكيف",
];

const CAR_BRANDS = ["nissan", "toyota", "lexus", "hyundai", "kia"];

// ── Main virtual user scenario ────────────────────────────────────────────────
export default function () {
  const headers = { "Content-Type": "application/json" };

  // 1. Health check
  {
    const start = Date.now();
    const res = http.get(`${BASE}/health`, { headers });
    healthLatency.add(Date.now() - start);
    const ok = check(res, { "health: status 200": (r) => r.status === 200 });
    errorRate.add(!ok);
  }

  sleep(0.2);

  // 2. List products (browse catalog)
  {
    const brand = CAR_BRANDS[Math.floor(Math.random() * CAR_BRANDS.length)];
    const url = `${BASE}/api/v1/products?car_brand=${brand}&limit=24&page=1&sort_by=popular`;
    const start = Date.now();
    const res = http.get(url, { headers });
    productLatency.add(Date.now() - start);
    const ok = check(res, {
      "products: status 200": (r) => r.status === 200,
      "products: has data":   (r) => {
        try { return JSON.parse(r.body).data !== undefined; } catch { return false; }
      },
    });
    errorRate.add(!ok);
  }

  sleep(0.3);

  // 3. Search (50% of users search)
  if (Math.random() < 0.5) {
    const query = SEARCH_QUERIES[Math.floor(Math.random() * SEARCH_QUERIES.length)];
    const url = `${BASE}/api/v1/products/search?q=${encodeURIComponent(query)}`;
    const start = Date.now();
    const res = http.get(url, { headers });
    searchLatency.add(Date.now() - start);
    const ok = check(res, { "search: status 200": (r) => r.status === 200 });
    errorRate.add(!ok);

    // Simulate AI Radar signal for zero results
    try {
      const body = JSON.parse(res.body);
      if (body.count === 0) {
        notFoundSignals.add(1);
      }
    } catch (_) { /* ignore */ }
  }

  sleep(0.5);

  // 4. Get categories
  {
    const res = http.get(`${BASE}/api/v1/categories`, { headers });
    const ok = check(res, {
      "categories: status 200":   (r) => r.status === 200,
      "categories: has list":     (r) => {
        try { return Array.isArray(JSON.parse(r.body).categories); } catch { return false; }
      },
    });
    errorRate.add(!ok);
  }

  sleep(0.2);

  // 5. Get single product (30% of users click a product)
  if (Math.random() < 0.3) {
    // List products first, pick first result
    const listRes = http.get(`${BASE}/api/v1/products?limit=1`, { headers });
    try {
      const data = JSON.parse(listRes.body);
      const products = data.data || [];
      if (products.length > 0) {
        const productID = products[0].id;
        const res = http.get(`${BASE}/api/v1/products/${productID}`, { headers });
        check(res, { "product detail: status 200": (r) => r.status === 200 });
      }
    } catch (_) { /* ignore */ }
  }

  sleep(1);
}

// ── Summary report ────────────────────────────────────────────────────────────
export function handleSummary(data) {
  const p50 = (m) => m?.values?.["p(50)"]?.toFixed(1) ?? "—";
  const p95 = (m) => m?.values?.["p(95)"]?.toFixed(1) ?? "—";
  const rate = (m) => ((m?.values?.rate ?? 0) * 100).toFixed(2);

  const report = `
╔══════════════════════════════════════════════════════════════════╗
║              GHYARI API — PERFORMANCE REPORT                    ║
╠══════════════════════════════════════════════════════════════════╣
║  Endpoint          │ p50 (ms)  │ p95 (ms)  │ SLA          ║
╠══════════════════════════════════════════════════════════════════╣
║  /health           │ ${p50(data.metrics.ghyari_health_ms).padEnd(9)} │ ${p95(data.metrics.ghyari_health_ms).padEnd(9)} │ <50ms p99     ║
║  /products (list)  │ ${p50(data.metrics.ghyari_product_list_ms).padEnd(9)} │ ${p95(data.metrics.ghyari_product_list_ms).padEnd(9)} │ <500ms p95    ║
║  /products/search  │ ${p50(data.metrics.ghyari_search_ms).padEnd(9)} │ ${p95(data.metrics.ghyari_search_ms).padEnd(9)} │ <800ms p95    ║
╠══════════════════════════════════════════════════════════════════╣
║  Error rate:        ${rate(data.metrics.ghyari_error_rate).padEnd(5)}%                                    ║
║  AI Radar signals:  ${(data.metrics.ghyari_ai_radar_signals?.values?.count ?? 0).toString().padEnd(6)}                                   ║
║  Total requests:    ${(data.metrics.http_reqs?.values?.count ?? 0).toString().padEnd(6)}                                   ║
╚══════════════════════════════════════════════════════════════════╝
`;
  return {
    stdout: report,
    "scripts/k6/results.json": JSON.stringify(data, null, 2),
  };
}
