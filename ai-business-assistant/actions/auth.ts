"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  type LoginFormValues,
  type RegisterFormValues,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/lib/validations/auth";
import type { AsyncActionResult } from "@/types";

export type { LoginFormValues, RegisterFormValues, ForgotPasswordFormValues, ResetPasswordFormValues };
export { LoginSchema, RegisterSchema, ForgotPasswordSchema, ResetPasswordSchema };

export async function loginAction(
  values: LoginFormValues,
): AsyncActionResult<{ redirectTo: string }> {
  const parsed = LoginSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { success: false, error: "Invalid email or password." };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        success: false,
        error: "Please verify your email address before signing in.",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { redirectTo: "/dashboard" } };
}

export async function registerAction(
  values: RegisterFormValues,
): AsyncActionResult {
  const parsed = RegisterSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
    },
  });

  if (error) {
    if (error.message.includes("User already registered")) {
      return {
        success: false,
        error: "An account with this email already exists.",
      };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(
  values: ForgotPasswordFormValues,
): AsyncActionResult {
  const parsed = ForgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    { redirectTo: `${siteUrl}/reset-password` },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}

export async function resetPasswordAction(
  values: ResetPasswordFormValues,
): AsyncActionResult {
  const parsed = ResetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}
