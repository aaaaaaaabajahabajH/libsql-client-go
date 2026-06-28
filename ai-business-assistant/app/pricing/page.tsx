import type { Metadata } from "next";
import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for AI Business Assistant. Start free, scale as you grow.",
};

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for trying out AI tools.",
    badge: null,
    highlighted: false,
    credits: 50,
    features: [
      "50 credits / month",
      "All 6 AI tools",
      "Basic history (7 days)",
      "Copy & download outputs",
      "Email support",
    ],
    cta: "Get Started Free",
    href: "/register",
  },
  {
    name: "Starter",
    price: 19,
    description: "For solopreneurs and small teams.",
    badge: "Most Popular",
    highlighted: true,
    credits: 1000,
    features: [
      "1,000 credits / month",
      "All 6 AI tools",
      "Full history (90 days)",
      "Save documents",
      "Priority generation",
      "Email & chat support",
    ],
    cta: "Start Starter Plan",
    href: "/register?plan=starter",
  },
  {
    name: "Pro",
    price: 49,
    description: "For growing businesses and agencies.",
    badge: null,
    highlighted: false,
    credits: 5000,
    features: [
      "5,000 credits / month",
      "All 6 AI tools",
      "Unlimited history",
      "Save & organize documents",
      "Bulk generation",
      "API access",
      "Priority support",
      "Custom prompts",
    ],
    cta: "Start Pro Plan",
    href: "/register?plan=pro",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 md:py-28 text-center">
          <div className="container max-w-3xl">
            <Badge variant="outline" className="mb-6 gap-1.5">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Simple Pricing
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              Plans for every{" "}
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                business size
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Start free, upgrade when you&apos;re ready. No hidden fees, cancel
              anytime.
            </p>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-20 md:pb-28">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={
                    plan.highlighted
                      ? "relative border-primary shadow-xl shadow-primary/10 scale-105"
                      : "border-border/50"
                  }
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="px-3 py-1 shadow-sm">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="pt-2">
                      <span className="text-4xl font-extrabold">
                        ${plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground text-sm ml-1">
                          / month
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {plan.credits.toLocaleString()} credits included
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className="w-full"
                      variant={plan.highlighted ? "default" : "outline"}
                    >
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* FAQ note */}
            <p className="text-center text-sm text-muted-foreground mt-12">
              All plans include a 14-day money-back guarantee.{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Contact us
              </Link>{" "}
              for enterprise pricing.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
