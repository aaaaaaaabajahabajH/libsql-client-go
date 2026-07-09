"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  loginAction,
  LoginSchema,
  type LoginFormValues,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    try {
      const result = await loginAction(values);
      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
        router.push(result.data.redirectTo);
        router.refresh();
      } else {
        toast({
          title: "Sign in failed",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          aria-invalid={!!errors.email}
          autoComplete="email"
          disabled={isSubmitting}
          id="email"
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            className="text-xs text-muted-foreground transition-colors hover:text-primary"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          aria-invalid={!!errors.password}
          autoComplete="current-password"
          disabled={isSubmitting}
          id="password"
          placeholder="••••••••"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
