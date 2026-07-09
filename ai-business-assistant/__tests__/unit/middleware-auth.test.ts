import { describe, it, expect } from "vitest";
import {
  isProtectedRoute,
  isAuthRoute,
  isApiRoute,
  isStaticAsset,
} from "@/middleware/auth";

describe("isProtectedRoute", () => {
  it("matches exact protected route", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isProtectedRoute("/settings")).toBe(true);
    expect(isProtectedRoute("/admin")).toBe(true);
  });

  it("matches protected route sub-paths", () => {
    expect(isProtectedRoute("/dashboard/tools")).toBe(true);
    expect(isProtectedRoute("/settings/profile")).toBe(true);
    expect(isProtectedRoute("/admin/users/123")).toBe(true);
  });

  it("does not match public routes", () => {
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/pricing")).toBe(false);
    expect(isProtectedRoute("/login")).toBe(false);
  });

  it("does not match partial route prefix", () => {
    expect(isProtectedRoute("/dashboard-public")).toBe(false);
    expect(isProtectedRoute("/settings-more")).toBe(false);
  });
});

describe("isAuthRoute", () => {
  it("matches auth routes", () => {
    expect(isAuthRoute("/login")).toBe(true);
    expect(isAuthRoute("/register")).toBe(true);
    expect(isAuthRoute("/forgot-password")).toBe(true);
    expect(isAuthRoute("/reset-password")).toBe(true);
  });

  it("does not match non-auth routes", () => {
    expect(isAuthRoute("/")).toBe(false);
    expect(isAuthRoute("/dashboard")).toBe(false);
    expect(isAuthRoute("/pricing")).toBe(false);
  });
});

describe("isApiRoute", () => {
  it("matches /api/* paths", () => {
    expect(isApiRoute("/api/health")).toBe(true);
    expect(isApiRoute("/api/generate")).toBe(true);
    expect(isApiRoute("/api/webhooks/stripe")).toBe(true);
  });

  it("does not match non-api paths", () => {
    expect(isApiRoute("/dashboard")).toBe(false);
    expect(isApiRoute("/pricing")).toBe(false);
    expect(isApiRoute("/apiary")).toBe(false);
  });
});

describe("isStaticAsset", () => {
  it("matches common static file extensions", () => {
    expect(isStaticAsset("/logo.svg")).toBe(true);
    expect(isStaticAsset("/image.png")).toBe(true);
    expect(isStaticAsset("/font.woff2")).toBe(true);
    expect(isStaticAsset("/script.js")).toBe(true);
  });

  it("does not match HTML or route paths", () => {
    expect(isStaticAsset("/dashboard")).toBe(false);
    expect(isStaticAsset("/pricing")).toBe(false);
    expect(isStaticAsset("/index.html")).toBe(false);
  });

  it("is case-insensitive for extensions", () => {
    expect(isStaticAsset("/image.PNG")).toBe(true);
    expect(isStaticAsset("/icon.SVG")).toBe(true);
  });
});
