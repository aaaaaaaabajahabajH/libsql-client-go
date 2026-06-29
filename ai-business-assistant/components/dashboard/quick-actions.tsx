import Link from "next/link";
import { Share2, FileText, Mail, Receipt, PenTool, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickAction {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  gradient: string;
  iconColor: string;
}

const actions: QuickAction[] = [
  {
    href: "/dashboard/tools/social-media",
    icon: Share2,
    label: "Social Post",
    gradient: "from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20",
    iconColor: "text-pink-500",
  },
  {
    href: "/dashboard/tools/email-writer",
    icon: Mail,
    label: "Email",
    gradient: "from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    href: "/dashboard/tools/blog-writer",
    icon: PenTool,
    label: "Blog Post",
    gradient: "from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20",
    iconColor: "text-violet-500",
  },
  {
    href: "/dashboard/tools/product-description",
    icon: FileText,
    label: "Product Desc.",
    gradient: "from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20",
    iconColor: "text-orange-500",
  },
  {
    href: "/dashboard/tools/invoice-generator",
    icon: Receipt,
    label: "Invoice",
    gradient: "from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20",
    iconColor: "text-emerald-500",
  },
  {
    href: "/dashboard/tools/translator",
    icon: Globe,
    label: "Translate",
    gradient: "from-indigo-500/10 to-blue-500/10 hover:from-indigo-500/20 hover:to-blue-500/20",
    iconColor: "text-indigo-500",
  },
];

export function QuickActions() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl p-3 transition-all duration-200",
                "bg-gradient-to-br border border-transparent hover:border-border/50",
                "hover:shadow-sm group",
                action.gradient,
              )}
            >
              <action.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", action.iconColor)} />
              <span className="text-[11px] font-medium text-center leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
