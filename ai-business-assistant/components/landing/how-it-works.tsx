import { UserPlus, Sparkles, Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Sign Up for Free",
    description:
      "Create your account in seconds — no credit card required. Get 50 free credits instantly to explore all AI tools.",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    gradient: "from-violet-500 to-primary",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Choose an AI Tool",
    description:
      "Pick from 6 powerful tools: social media posts, emails, blog articles, product descriptions, invoices, or translations.",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    gradient: "from-primary to-blue-500",
  },
  {
    step: "03",
    icon: Download,
    title: "Generate & Save Content",
    description:
      "Fill in a simple form, click Generate, and get polished content in seconds. Save, copy, or export with one click.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    gradient: "from-emerald-500 to-teal-500",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-muted/20" id="how-it-works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Badge className="text-xs font-semibold px-3 py-1" variant="secondary">
            3 Simple Steps
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Up and running{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              in minutes
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            No complex setup. No technical knowledge required. Just sign up and start creating.
          </p>
        </div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Connecting line (desktop only) */}
          <div className="absolute top-14 left-1/6 right-1/6 hidden md:block">
            <div className="h-px w-full bg-gradient-to-r from-violet-500/30 via-primary/30 to-emerald-500/30" />
          </div>

          {steps.map((step, index) => (
            <div key={step.step} className="relative flex flex-col items-center text-center gap-4">
              {/* Connector line between steps (mobile) */}
              {index < steps.length - 1 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-border to-transparent md:hidden" />
              )}

              {/* Step number circle */}
              <div className="relative">
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl",
                    "border-2 shadow-lg transition-transform hover:scale-105 duration-300",
                    step.bg,
                    step.border,
                  )}
                >
                  <step.icon className={cn("h-7 w-7", step.color)} />
                </div>
                <div
                  className={cn(
                    "absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center",
                    "rounded-full bg-gradient-to-br text-[10px] font-black text-white shadow-sm",
                    step.gradient,
                  )}
                >
                  {index + 1}
                </div>
              </div>

              {/* Step number label */}
              <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                Step {step.step}
              </span>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
