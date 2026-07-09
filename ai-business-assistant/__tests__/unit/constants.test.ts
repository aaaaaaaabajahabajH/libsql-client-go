import { describe, it, expect } from "vitest";
import {
  TOOL_CREDIT_COSTS,
  PLAN_CREDITS,
  PLAN_HISTORY_DAYS,
  TOOL_CONFIGS,
  PLAN_CONFIGS,
  PROTECTED_ROUTES,
  AUTH_ROUTES,
  PUBLIC_ROUTES,
} from "@/utils/constants";

describe("TOOL_CREDIT_COSTS", () => {
  it("every cost is a positive integer", () => {
    for (const [tool, cost] of Object.entries(TOOL_CREDIT_COSTS)) {
      expect(cost, `${tool} cost must be > 0`).toBeGreaterThan(0);
      expect(Number.isInteger(cost), `${tool} cost must be an integer`).toBe(true);
    }
  });

  it("contains all 6 expected tools", () => {
    const ids = Object.keys(TOOL_CREDIT_COSTS);
    expect(ids).toContain("social-media");
    expect(ids).toContain("product-description");
    expect(ids).toContain("blog-writer");
    expect(ids).toContain("email-writer");
    expect(ids).toContain("invoice-generator");
    expect(ids).toContain("translator");
  });
});

describe("PLAN_CREDITS", () => {
  it("free plan has the fewest credits", () => {
    expect(PLAN_CREDITS.free).toBeLessThan(PLAN_CREDITS.starter);
  });

  it("pro and enterprise have very high (effectively unlimited) credits", () => {
    expect(PLAN_CREDITS.pro).toBeGreaterThan(100_000);
    expect(PLAN_CREDITS.enterprise).toBeGreaterThan(100_000);
  });

  it("all credit values are positive integers", () => {
    for (const [plan, credits] of Object.entries(PLAN_CREDITS)) {
      expect(credits, `${plan} credits must be > 0`).toBeGreaterThan(0);
      expect(Number.isInteger(credits), `${plan} credits must be integer`).toBe(true);
    }
  });
});

describe("PLAN_HISTORY_DAYS", () => {
  it("free plan has the shortest history", () => {
    expect(PLAN_HISTORY_DAYS.free).not.toBeNull();
    expect(PLAN_HISTORY_DAYS.free).toBeLessThan(PLAN_HISTORY_DAYS.starter as number);
  });

  it("pro and enterprise have null (unlimited) history", () => {
    expect(PLAN_HISTORY_DAYS.pro).toBeNull();
    expect(PLAN_HISTORY_DAYS.enterprise).toBeNull();
  });
});

describe("TOOL_CONFIGS", () => {
  it("has 6 tools", () => {
    expect(TOOL_CONFIGS).toHaveLength(6);
  });

  it("every tool id is unique", () => {
    const ids = TOOL_CONFIGS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every tool's creditCost matches TOOL_CREDIT_COSTS", () => {
    for (const tool of TOOL_CONFIGS) {
      expect(tool.creditCost).toBe(TOOL_CREDIT_COSTS[tool.id]);
    }
  });

  it("every tool has a label, description, icon, and gradient", () => {
    for (const tool of TOOL_CONFIGS) {
      expect(tool.label.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.icon).toBeDefined();
      expect(tool.gradient.length).toBeGreaterThan(0);
    }
  });
});

describe("PLAN_CONFIGS", () => {
  it("contains free, starter, and pro plans", () => {
    const ids = PLAN_CONFIGS.map((p) => p.id);
    expect(ids).toContain("free");
    expect(ids).toContain("starter");
    expect(ids).toContain("pro");
  });

  it("free plan has price 0", () => {
    const free = PLAN_CONFIGS.find((p) => p.id === "free");
    expect(free?.price).toBe(0);
  });

  it("paid plans have positive prices", () => {
    const paid = PLAN_CONFIGS.filter((p) => p.id !== "free");
    for (const plan of paid) {
      expect(plan.price).toBeGreaterThan(0);
    }
  });

  it("every plan's credits matches PLAN_CREDITS", () => {
    for (const plan of PLAN_CONFIGS) {
      const expected = PLAN_CREDITS[plan.id as keyof typeof PLAN_CREDITS];
      if (expected !== undefined) {
        expect(plan.credits).toBe(expected);
      }
    }
  });

  it("only one plan is highlighted", () => {
    const highlighted = PLAN_CONFIGS.filter((p) => p.highlighted);
    expect(highlighted).toHaveLength(1);
  });

  it("every plan has at least one included feature", () => {
    for (const plan of PLAN_CONFIGS) {
      const included = plan.features.filter((f) => f.included);
      expect(included.length).toBeGreaterThan(0);
    }
  });
});

describe("Route constants", () => {
  it("protected routes start with /", () => {
    for (const route of PROTECTED_ROUTES) {
      expect(route.startsWith("/")).toBe(true);
    }
  });

  it("auth routes include login and register", () => {
    expect(AUTH_ROUTES).toContain("/login");
    expect(AUTH_ROUTES).toContain("/register");
  });

  it("no overlap between protected and auth routes", () => {
    for (const route of AUTH_ROUTES) {
      expect(PROTECTED_ROUTES).not.toContain(route);
    }
  });

  it("public routes include root and pricing", () => {
    expect(PUBLIC_ROUTES).toContain("/");
    expect(PUBLIC_ROUTES).toContain("/pricing");
  });
});
