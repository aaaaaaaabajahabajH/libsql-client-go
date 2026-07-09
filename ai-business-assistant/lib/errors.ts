export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "RATE_LIMITED"
  | "PAYMENT_REQUIRED"
  | "CREDITS_EXHAUSTED"
  | "AI_PROVIDER"
  | "DATABASE"
  | "INTERNAL";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, code: ErrorCode, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You don't have permission to perform this action") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  readonly fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message, "VALIDATION", 422);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class RateLimitError extends AppError {
  readonly retryAfter: number;

  constructor(retryAfter = 60) {
    super("Too many requests. Please slow down.", "RATE_LIMITED", 429);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = "This feature requires a paid plan") {
    super(message, "PAYMENT_REQUIRED", 402);
    this.name = "PaymentRequiredError";
  }
}

export class CreditsExhaustedError extends AppError {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits. This action requires ${required} credits but you only have ${available}.`,
      "CREDITS_EXHAUSTED",
      402,
    );
    this.name = "CreditsExhaustedError";
  }
}

export class AIProviderError extends AppError {
  constructor(message: string) {
    super(`AI generation failed: ${message}`, "AI_PROVIDER", 502);
    this.name = "AIProviderError";
  }
}

export class DatabaseError extends AppError {
  constructor(message = "A database error occurred") {
    super(message, "DATABASE", 503);
    this.name = "DatabaseError";
  }
}

export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error) return new AppError(err.message, "INTERNAL", 500);
  return new AppError("An unexpected error occurred", "INTERNAL", 500);
}

export function isOperationalError(err: unknown): err is AppError {
  return err instanceof AppError && err.isOperational;
}

export function formatApiError(err: unknown): {
  error: { code: string; message: string; fields?: Record<string, string> };
  status: number;
} {
  const appErr = toAppError(err);
  return {
    error: {
      code: appErr.code,
      message: appErr.message,
      ...(appErr instanceof ValidationError && appErr.fields
        ? { fields: appErr.fields }
        : {}),
    },
    status: appErr.statusCode,
  };
}
