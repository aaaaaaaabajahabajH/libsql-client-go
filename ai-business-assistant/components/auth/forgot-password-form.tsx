"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  forgotPasswordAction,
  ForgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordAction(values);
      if (result.success) {
        setIsSuccess(true);
      } else {
        toast({
          title: "Request failed",
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
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
          <CheckCircle2 className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold">Check your inbox</h3>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email address, we&apos;ve sent a
            password reset link. Check your spam folder if you don&apos;t see
            it within a few minutes.
          </p>
        </div>
      </div>
    );
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

      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending link…
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
    </form>
  );
}
