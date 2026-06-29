import Link from "next/link";
import {
  FileText,
  Mail,
  Globe,
  Share2,
  Receipt,
  PenTool,
  Zap,
  Shield,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tools = [
  {
    icon: Share2,
    title: "Social Media Generator",
    description:
      "Create scroll-stopping posts for Twitter, LinkedIn, and Instagram. Optimized for engagement on every platform.",
    gradient: "from-pink-500 to-rose-500",
    hoverGlow: "group-hover:shadow-pink-500/20",
    badge: "Popular",
    credits: 5,
    href: "/dashboard/tools/social-media",
  },
  {
    icon: FileText,
    title: "Product Description",
    description:
      "Write compelling product copy that converts browsers into buyers. SEO-optimized and persuasion-driven.",
    gradient: "from-orange-500 to-amber-500",
    hoverGlow: "group-hover:shadow-orange-500/20",
    credits: 5,
    href: "/dashboard/tools/product-description",
  },
  {
    icon: Mail,
    title: "Email Writer",
    description:
      "Draft professional emails, follow-ups, and campaigns with AI precision. Every tone, any audience.",
    gradient: "from-blue-500 to-cyan-500",
    hoverGlow: "group-hover:shadow-blue-500/20",
    credits: 5,
    href: "/dashboard/tools/email-writer",
  },
  {
    icon: Receipt,
    title: "Invoice Generator",
    description:
      "Generate clean, professional invoices and business documents in seconds. Ready to send or print.",
    gradient: "from-emerald-500 to-teal-500",
    hoverGlow: "group-hover:shadow-emerald-500/20",
    credits: 3,
    href: "/dashboard/tools/invoice-generator",
  },
  {
    icon: PenTool,
    title: "Blog Writer",
    description:
      "Produce long-form SEO-optimized articles that rank on Google and keep readers engaged from start to finish.",
    gradient: "from-violet-500 to-purple-500",
    hoverGlow: "group-hover:shadow-violet-500/20",
    badge: "New",
    credits: 10,
    href: "/dashboard/tools/blog-writer",
  },
  {
    icon: Globe,
    title: "Text Translator",
    description:
      "Translate content into 50+ languages while preserving tone, context, and cultural nuance perfectly.",
    gradient: "from-indigo-500 to-blue-500",
    hoverGlow: "group-hover:shadow-indigo-500/20",
    credits: 3,
    href: "/dashboard/tools/translator",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "10× Faster",
    description: "Generate professional content in seconds, not hours. Free your team for higher-value work.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your data is encrypted at rest and in transit. We never use your content to train AI models.",
  },
  {
    icon: RefreshCw,
    title: "Always Improving",
    description: "New AI models and tools are added every month. Your subscription only gets more valuable over time.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
            6 AI Tools
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
            Every tool you need,{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
              all in one place
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Stop juggling multiple apps. Our AI suite covers every business content need — from social media to invoices.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className={cn(
                "group relative rounded-2xl border border-border/50 bg-card p-6",
                "hover:border-border hover:shadow-xl transition-all duration-300",
                tool.hoverGlow,
              )}
            >
              {/* Gradient hover overlay */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, transparent 0%, transparent 60%, hsl(var(--primary) / 0.03) 100%)`,
                }}
              />

              <div className="relative">
                {/* Header row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={cn(
                      "inline-flex h-12 w-12 items-center justify-center rounded-xl",
                      "bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-105",
                      tool.gradient,
                    )}
                  >
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    {tool.badge && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-semibold">
                        {tool.badge}
                      </Badge>
                    )}
                    <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span className="font-medium">{tool.credits}</span>
                    </div>
                  </div>
                </div>

                <h3 className="font-semibold text-base mb-2 leading-snug">{tool.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {tool.description}
                </p>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:gap-2.5 transition-all duration-200"
                >
                  Try for free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          {benefits.map((b) => (
            <div key={b.title} className="space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-lg">{b.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <Button asChild size="lg" className="h-12 px-8 text-base shadow-glow">
            <Link href="/register">
              Start creating for free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
