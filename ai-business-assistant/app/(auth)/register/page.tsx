import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create your free AI Business Assistant account and get 50 credits.",
};

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground mt-1.5">
          Get started free — 50 credits included, no card required
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
