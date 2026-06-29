import Link from "next/link";
import { FileText, Mail, Share2, Receipt, PenTool, Globe, ArrowRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DbToolType } from "@/types/database";

interface ToolCard {
  id: DbToolType;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gradient: string;
  iconGradient: string;
  badge?: string;
  creditCost: number;
}

const tools: ToolCard[] = [
  {
    id: "social-media",
    href: "/dashboard/tools/social-media",
    icon: Share2,
    title: "Social Media Generator",
    description: "Create viral posts for any platform in seconds. Optimized for engagement.",
    gradient: "from-pink-500/5 to-rose-500/5 group-hover:from-pink-500/10 group-hover:to-rose-500/10",
    iconGradient: "from-pink-500 to-rose-500",
    badge: "Popular",
    creditCost: 5,
  },
  {
    id: "product-description",
    href: "/dashboard/tools/product-description",
    icon: FileText,
    title: "Product Description",
    description: "Write compelling descriptions that sell — SEO optimized and conversion focused.",
    gradient: "from-orange-500/5 to-amber-500/5 group-hover:from-orange-500/10 group-hover:to-amber-500/10",
    iconGradient: "from-orange-500 to-amber-500",
    creditCost: 5,
  },
  {
    id: "email-writer",
    href: "/dashboard/tools/email-writer",
    icon: Mail,
    title: "Email Writer",
    description: "Professional emails and campaigns crafted in one click. Every tone, any audience.",
    gradient: "from-blue-500/5 to-cyan-500/5 group-hover:from-blue-500/10 group-hover:to-cyan-500/10",
    iconGradient: "from-blue-500 to-cyan-500",
    creditCost: 5,
  },
  {
    id: "invoice-generator",
    href: "/dashboard/tools/invoice-generator",
    icon: Receipt,
    title: "Invoice Generator",
    description: "Generate clean, professional invoices instantly. Ready to send or print.",
    gradient: "from-emerald-500/5 to-teal-500/5 group-hover:from-emerald-500/10 group-hover:to-teal-500/10",
    iconGradient: "from-emerald-500 to-teal-500",
    creditCost: 3,
  },
  {
    id: "blog-writer",
    href: "/dashboard/tools/blog-writer",
    icon: PenTool,
    title: "Blog Writer",
    description: "Long-form SEO content that ranks and keeps readers engaged. Research included.",
    gradient: "from-violet-500/5 to-purple-500/5 group-hover:from-violet-500/10 group-hover:to-purple-500/10",
    iconGradient: "from-violet-500 to-purple-500",
    badge: "New",
    creditCost: 10,
  },
  {
    id: "translator",
    href: "/dashboard/tools/translator",
    icon: Globe,
    title: "Text Translator",
    description: "Translate into 50+ languages with tone and context preservation.",
    gradient: "from-indigo-500/5 to-blue-500/5 group-hover:from-indigo-500/10 group-hover:to-blue-500/10",
    iconGradient: "from-indigo-500 to-blue-500",
    creditCost: 3,
  },
];

export function AIToolsGrid() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold tracking-tight">AI Tools</h2>
        <Badge variant="outline" className="text-xs font-normal">
          {tools.length} tools
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card
            key={tool.id}
            className={cn(
              "group relative overflow-hidden border-border/50 transition-all duration-300",
              "hover:border-border hover:shadow-lg",
            )}
          >
            {/* Gradient background */}
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br transition-all duration-300",
                tool.gradient,
              )}
            />

            <CardHeader className="relative pb-3 pt-5">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "inline-flex h-11 w-11 items-center justify-center rounded-xl",
                    "bg-gradient-to-br shadow-md transition-transform duration-300 group-hover:scale-105",
                    tool.iconGradient,
                  )}
                >
                  <tool.icon className="h-5 w-5 text-white" />
                </div>

                <div className="flex items-center gap-2">
                  {tool.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-5 px-1.5 font-semibold"
                    >
                      {tool.badge}
                    </Badge>
                  )}
                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span className="font-medium tabular-nums">{tool.creditCost}</span>
                  </div>
                </div>
              </div>

              <CardTitle className="text-sm font-semibold mt-3 leading-snug">
                {tool.title}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {tool.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="relative pt-0 pb-4">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-full justify-between text-xs",
                  "text-muted-foreground hover:text-foreground",
                  "transition-all duration-200",
                )}
              >
                <Link href={tool.href}>
                  Launch Tool
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
