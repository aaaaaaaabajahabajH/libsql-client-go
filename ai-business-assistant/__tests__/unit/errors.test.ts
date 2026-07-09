import { describe, it, expect } from "vitest";
import {
  AppError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  CreditsExhaustedError,
  AIProviderError,
  toAppError,
  isOperationalError,
  formatApiError,
} from "@/lib/errors";

describe("AppError", () => {
  it("creates error with correct properties", () => {
    const err = new AppError("Test error", "INTERNAL", 500);
    expect(err.message).toBe("Test error");
    expect(err.code).toBe("INTERNAL");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });
});

describe("AuthError", () => {
  it("has 401 status and UNAUTHORIZED code", () => {
    const err = new AuthError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("accepts custom message", () => {
    const err = new AuthError("Session expired");
    expect(err.message).toBe("Session expired");
  });
});

describe("ForbiddenError", () => {
  it("has 403 status", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});

describe("NotFoundError", () => {
  it("includes resource name in message", () => {
    const err = new NotFoundError("User");
    expect(err.message).toBe("User not found");
    expect(err.statusCode).toBe(404);
  });
});

describe("ValidationError", () => {
  it("carries field errors", () => {
    const fields = { email: "Invalid email", name: "Name is required" };
    const err = new ValidationError("Validation failed", fields);
    expect(err.statusCode).toBe(422);
    expect(err.fields).toEqual(fields);
  });
});

describe("RateLimitError", () => {
  it("has 429 status with retryAfter", () => {
    const err = new RateLimitError(120);
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(120);
    expect(err.code).toBe("RATE_LIMITED");
  });
});

describe("CreditsExhaustedError", () => {
  it("formats credit shortage message", () => {
    const err = new CreditsExhaustedError(10, 3);
    expect(err.message).toContain("10 credits");
    expect(err.message).toContain("3");
    expect(err.statusCode).toBe(402);
  });
});

describe("AIProviderError", () => {
  it("prefixes message with AI context", () => {
    const err = new AIProviderError("model overloaded");
    expect(err.message).toContain("model overloaded");
    expect(err.statusCode).toBe(502);
  });
});

describe("toAppError", () => {
  it("returns AppError as-is", () => {
    const original = new AuthError();
    expect(toAppError(original)).toBe(original);
  });

  it("wraps plain Error", () => {
    const plain = new Error("Something broke");
    const wrapped = toAppError(plain);
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.message).toBe("Something broke");
    expect(wrapped.statusCode).toBe(500);
  });

  it("wraps non-Error unknown", () => {
    const wrapped = toAppError("a string error");
    expect(wrapped).toBeInstanceOf(AppError);
    expect(wrapped.code).toBe("INTERNAL");
  });
});

describe("isOperationalError", () => {
  it("returns true for AppError subclasses", () => {
    expect(isOperationalError(new AuthError())).toBe(true);
    expect(isOperationalError(new NotFoundError())).toBe(true);
  });

  it("returns false for plain Errors", () => {
    expect(isOperationalError(new Error("plain"))).toBe(false);
    expect(isOperationalError("string")).toBe(false);
  });
});

describe("formatApiError", () => {
  it("formats error into response shape", () => {
    const err = new AuthError("Not logged in");
    const result = formatApiError(err);
    expect(result.status).toBe(401);
    expect(result.error.code).toBe("UNAUTHORIZED");
    expect(result.error.message).toBe("Not logged in");
  });

  it("includes fields for ValidationError", () => {
    const err = new ValidationError("Invalid", { email: "bad email" });
    const result = formatApiError(err);
    expect(result.error.fields).toEqual({ email: "bad email" });
  });
});
