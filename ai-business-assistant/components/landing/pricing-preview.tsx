import { Check, X, Zap, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PLAN_CONFIGS } from "@/utils/constants";

const previewPlans = PLAN_CONFIGS.filter((p) =>
  ["free", "starter", "pro"].includes(p.id),
);

export function PricingPreview() {
  return (
    <section className="py-20 sm:py-28" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge className="text-xs font-semibold px-3 py-1" variant="secondary">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Start free, scale{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              as you grow
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            No hidden fees. Cancel anytime. Every plan includes access to all 6 AI tools.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {previewPlans.map((plan) => (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col border transition-all duration-300",
                plan.highlighted
                  ? "border-primary shadow-lg shadow-primary/10 scale-105"
                  : "border-border/50 hover:border-border hover:shadow-md",
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <Badge className="gap-1 px-3 py-0.5 bg-primary text-primary-foreground text-xs font-bold shadow-glow-sm">
                    <Star className="h-3 w-3 fill-current" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4 pt-8">
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground text-sm mb-1">/month</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>

                {/* Credits highlight */}
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <Zap className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold">
                    {plan.credits.toLocaleString()} credits / month
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 pt-0">
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      {f.included ? (
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/60"}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={cn(
                    "w-full",
                    plan.highlighted ? "shadow-glow-sm" : "",
                  )}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link href="/register">
                    {plan.price === 0 ? "Start for Free" : `Start ${plan.name}`}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View full pricing CTA */}
        <div className="mt-10 text-center">
          <Button asChild className="gap-2 text-muted-foreground hover:text-foreground" variant="ghost">
            <Link href="/pricing">
              View full pricing details
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
