import Link from "next/link";
import {
  FileText,
  Mail,
  Share2,
  Receipt,
  PenTool,
  Globe,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const tools = [
  {
    href: "/dashboard/tools/social-media",
    icon: Share2,
    title: "Social Media Generator",
    description: "Create viral posts for any platform in seconds.",
    gradient: "from-pink-500 to-rose-500",
    badge: "Popular",
    credits: 5,
  },
  {
    href: "/dashboard/tools/product-description",
    icon: FileText,
    title: "Product Description",
    description: "Write descriptions that sell — SEO optimized.",
    gradient: "from-orange-500 to-amber-500",
    credits: 5,
  },
  {
    href: "/dashboard/tools/email-writer",
    icon: Mail,
    title: "Email Writer",
    description: "Professional emails and campaigns in one click.",
    gradient: "from-blue-500 to-cyan-500",
    credits: 5,
  },
  {
    href: "/dashboard/tools/invoice-generator",
    icon: Receipt,
    title: "Invoice Generator",
    description: "Generate clean, professional invoices instantly.",
    gradient: "from-emerald-500 to-teal-500",
    credits: 3,
  },
  {
    href: "/dashboard/tools/blog-writer",
    icon: PenTool,
    title: "Blog Writer",
    description: "Long-form SEO content that ranks and engages.",
    gradient: "from-violet-500 to-purple-500",
    badge: "New",
    credits: 10,
  },
  {
    href: "/dashboard/tools/translator",
    icon: Globe,
    title: "Text Translator",
    description: "Translate into 50+ languages with tone preservation.",
    gradient: "from-indigo-500 to-blue-500",
    credits: 3,
  },
];

export function AIToolsGrid() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI Tools</h2>
        <Badge variant="outline" className="text-xs">
          6 tools available
        </Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <Card
            key={tool.href}
            className="group relative border-border/50 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`}
            />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${tool.gradient} shadow-md`}
                >
                  <tool.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  {tool.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {tool.badge}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {tool.credits} cr
                  </span>
                </div>
              </div>
              <CardTitle className="text-sm font-semibold mt-3">
                {tool.title}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-8 w-full justify-between text-xs text-muted-foreground hover:text-foreground group-hover:bg-primary/5"
              >
                <Link href={tool.href}>
                  Open Tool
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
