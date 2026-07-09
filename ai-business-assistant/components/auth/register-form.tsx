"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  registerAction,
  RegisterSchema,
  type RegisterFormValues,
} from "@/actions/auth";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";

export function RegisterForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
  });

  const password = watch("password", "");

  async function onSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);
    try {
      const result = await registerAction(values);
      if (result.success) {
        setIsSuccess(true);
      } else {
        toast({
          title: "Registration failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex animate-fade-in-scale flex-col items-center gap-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent you a verification link. Click it to activate your
            account and start using AI Business Assistant.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          aria-invalid={!!errors.fullName}
          autoComplete="name"
          disabled={isSubmitting}
          id="fullName"
          placeholder="Jane Smith"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive" role="alert">
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email">Email address</Label>
        <Input
          aria-invalid={!!errors.email}
          autoComplete="email"
          disabled={isSubmitting}
          id="reg-email"
          placeholder="you@company.com"
          type="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <PasswordInput
          aria-invalid={!!errors.password}
          autoComplete="new-password"
          disabled={isSubmitting}
          id="reg-password"
          placeholder="Create a strong password"
          {...register("password")}
        />
        <PasswordStrength password={password} />
        {errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          aria-invalid={!!errors.confirmPassword}
          autoComplete="new-password"
          disabled={isSubmitting}
          id="confirmPassword"
          placeholder="••••••••"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2.5">
          <input
            aria-invalid={!!errors.acceptTerms}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-input accent-primary disabled:cursor-not-allowed"
            disabled={isSubmitting}
            id="acceptTerms"
            type="checkbox"
            {...register("acceptTerms")}
          />
          <Label
            className="cursor-pointer text-sm font-normal leading-snug"
            htmlFor="acceptTerms"
          >
            I agree to the{" "}
            <Link
              className="text-primary hover:underline"
              href="/terms"
              target="_blank"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              className="text-primary hover:underline"
              href="/privacy"
              target="_blank"
            >
              Privacy Policy
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-destructive" role="alert">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create free account"
        )}
      </Button>
    </form>
  );
}
