"use server";

import { z } from "zod";

import type { AsyncActionResult } from "@/types";

/* ─── Validation schemas ─────────────────────────────────────── */

export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/* ─── Inferred form types ────────────────────────────────────── */

export type LoginFormValues = z.infer<typeof LoginSchema>;
export type RegisterFormValues = z.infer<typeof RegisterSchema>;
export type ForgotPasswordFormValues = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof ResetPasswordSchema>;

/* ─── Server action signatures ───────────────────────────────── */
// Implementations added in Milestone 3: Authentication

export async function loginAction(
  _values: LoginFormValues,
): AsyncActionResult<{ redirectTo: string }> {
  throw new Error("loginAction: implemented in Milestone 3");
}

export async function registerAction(
  _values: RegisterFormValues,
): AsyncActionResult {
  throw new Error("registerAction: implemented in Milestone 3");
}

export async function logoutAction(): AsyncActionResult {
  throw new Error("logoutAction: implemented in Milestone 3");
}

export async function forgotPasswordAction(
  _values: ForgotPasswordFormValues,
): AsyncActionResult {
  throw new Error("forgotPasswordAction: implemented in Milestone 3");
}

export async function resetPasswordAction(
  _values: ResetPasswordFormValues,
): AsyncActionResult {
  throw new Error("resetPasswordAction: implemented in Milestone 3");
}
