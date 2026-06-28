import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-[80px]" />
      </div>

      <div className="container text-center">
        <div className="animate-fade-in">
          <Badge variant="outline" className="mb-6 gap-1.5 py-1 px-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Powered by Advanced AI</span>
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            AI Tools That{" "}
            <span className="bg-gradient-to-r from-primary via-violet-500 to-indigo-500 bg-clip-text text-transparent">
              Grow Your Business
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate content, write emails, create invoices, translate text, and
            more — all powered by AI. Save hours every day and focus on what
            matters.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gap-2 text-base h-12">
              <Link href="/register">
                Start for Free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 text-base h-12">
              <Link href="/pricing">
                <Zap className="h-5 w-5" />
                View Pricing
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required &bull; 50 free credits monthly &bull; Cancel anytime
          </p>
        </div>

        {/* Dashboard preview */}
        <div className="mt-16 animate-fade-in relative">
          <div className="relative mx-auto max-w-5xl rounded-xl border border-border/50 bg-card shadow-2xl shadow-primary/10 overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-muted/50">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-muted-foreground">
                AI Business Assistant — Dashboard
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 p-6 text-left">
              {[
                { label: "Credits Used", value: "2,340", icon: "⚡" },
                { label: "Documents Saved", value: "128", icon: "📄" },
                { label: "Time Saved", value: "47h", icon: "⏱" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-border/50 bg-background p-4"
                >
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-6 pb-6">
              {[
                "Social Media Post",
                "Email Writer",
                "Blog Article",
                "Product Description",
                "Invoice Generator",
                "Translator",
              ].map((tool) => (
                <div
                  key={tool}
                  className="rounded-lg border border-border/50 bg-primary/5 p-3 text-center"
                >
                  <p className="text-xs font-medium text-primary">{tool}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
