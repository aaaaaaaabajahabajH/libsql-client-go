"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
  ];

  if (!password) return null;

  return (
    <div className="flex gap-3 mt-2">
      {checks.map((c) => (
        <div key={c.label} className="flex items-center gap-1 text-xs">
          <div
            className={`h-3 w-3 rounded-full flex items-center justify-center ${c.pass ? "bg-emerald-500" : "bg-muted"}`}
          >
            {c.pass && <Check className="h-2 w-2 text-white" />}
          </div>
          <span className={c.pass ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}>
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 mb-4">
          <Check className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="font-semibold mb-2">Account created!</h3>
        <p className="text-sm text-muted-foreground">
          Redirecting you to the dashboard...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Jane Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <PasswordStrength password={password} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Creating account..." : "Create Free Account"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
