"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  resetPasswordAction,
  ResetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/actions/auth";
import { PasswordStrength } from "@/components/auth/password-strength";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";

export function ResetPasswordForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
  });

  const password = watch("password", "");

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsSubmitting(true);
    try {
      const result = await resetPasswordAction(values);
      if (result.success) {
        setIsSuccess(true);
      } else {
        toast({
          title: "Password reset failed",
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
      <div className="flex animate-fade-in-scale flex-col items-center gap-5 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold">Password updated</h3>
          <p className="text-sm text-muted-foreground">
            Your password has been reset successfully. Sign in with your new
            password.
          </p>
        </div>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <PasswordInput
          aria-invalid={!!errors.password}
          autoComplete="new-password"
          disabled={isSubmitting}
          id="new-password"
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
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
        <PasswordInput
          aria-invalid={!!errors.confirmPassword}
          autoComplete="new-password"
          disabled={isSubmitting}
          id="confirm-new-password"
          placeholder="••••••••"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Updating password…
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
