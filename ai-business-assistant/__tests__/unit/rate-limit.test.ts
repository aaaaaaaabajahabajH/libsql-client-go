import { describe, it, expect } from "vitest";
import { rateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";

// The module uses a module-level Map and lastCleanup — isolate between tests
// by using unique keys per test.

describe("rateLimit", () => {
  let keyCounter = 0;
  const freshKey = () => `test-key-${Date.now()}-${++keyCounter}`;

  it("allows first request and returns remaining = max - 1", () => {
    const result = rateLimit(freshKey(), { windowMs: 60_000, max: 5 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.retryAfter).toBeUndefined();
  });

  it("decrements remaining on subsequent requests", () => {
    const key = freshKey();
    const config = { windowMs: 60_000, max: 5 };
    rateLimit(key, config);
    const second = rateLimit(key, config);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(3);
  });

  it("blocks request when count exceeds max", () => {
    const key = freshKey();
    const config = { windowMs: 60_000, max: 3 };
    rateLimit(key, config); // 1
    rateLimit(key, config); // 2
    rateLimit(key, config); // 3
    const blocked = rateLimit(key, config); // 4 — over limit
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("sets retryAfter (in seconds) when blocked", () => {
    const key = freshKey();
    const config = { windowMs: 60_000, max: 1 };
    rateLimit(key, config); // 1
    const blocked = rateLimit(key, config); // 2 — over limit
    expect(blocked.allowed).toBe(false);
    expect(typeof blocked.retryAfter).toBe("number");
    expect(blocked.retryAfter).toBeGreaterThan(0);
    expect(blocked.retryAfter).toBeLessThanOrEqual(60);
  });

  it("different keys do not interfere with each other", () => {
    const config = { windowMs: 60_000, max: 2 };
    const keyA = freshKey();
    const keyB = freshKey();
    rateLimit(keyA, config);
    rateLimit(keyA, config);
    // keyA is now at max, keyB should still be fresh
    const resultB = rateLimit(keyB, config);
    expect(resultB.allowed).toBe(true);
    expect(resultB.remaining).toBe(1);
  });

  it("resets window after windowMs elapses", async () => {
    const key = freshKey();
    const config = { windowMs: 50, max: 1 };
    rateLimit(key, config); // 1 — at max
    const blocked = rateLimit(key, config); // 2 — blocked
    expect(blocked.allowed).toBe(false);

    await new Promise((r) => setTimeout(r, 60));

    const after = rateLimit(key, config); // window expired — resets
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it("returns resetAt as a future timestamp", () => {
    const before = Date.now();
    const result = rateLimit(freshKey(), { windowMs: 60_000, max: 10 });
    expect(result.resetAt).toBeGreaterThan(before);
    expect(result.resetAt).toBeLessThanOrEqual(before + 60_000 + 5);
  });
});

describe("RATE_LIMIT_CONFIGS", () => {
  it("has expected keys", () => {
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("api");
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("auth");
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("ai");
    expect(RATE_LIMIT_CONFIGS).toHaveProperty("webhook");
  });

  it("api config allows 60 requests per minute", () => {
    expect(RATE_LIMIT_CONFIGS.api.max).toBe(60);
    expect(RATE_LIMIT_CONFIGS.api.windowMs).toBe(60_000);
  });

  it("auth config is more restrictive (10 per 15 min)", () => {
    expect(RATE_LIMIT_CONFIGS.auth.max).toBe(10);
    expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(15 * 60_000);
  });

  it("ai config allows 20 requests per minute", () => {
    expect(RATE_LIMIT_CONFIGS.ai.max).toBe(20);
    expect(RATE_LIMIT_CONFIGS.ai.windowMs).toBe(60_000);
  });

  it("all configs have positive windowMs and max", () => {
    for (const cfg of Object.values(RATE_LIMIT_CONFIGS)) {
      expect(cfg.windowMs).toBeGreaterThan(0);
      expect(cfg.max).toBeGreaterThan(0);
    }
  });
});
