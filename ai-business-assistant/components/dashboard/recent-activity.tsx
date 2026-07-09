import { FileText, Mail, Share2, Receipt, PenTool, Globe, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DbToolType } from "@/types/database";
import { formatDate } from "@/utils/format";

const toolIconMap: Record<DbToolType, React.ComponentType<{ className?: string }>> = {
  "social-media": Share2,
  "product-description": FileText,
  "email-writer": Mail,
  "invoice-generator": Receipt,
  "blog-writer": PenTool,
  "translator": Globe,
};

const toolLabelMap: Record<DbToolType, string> = {
  "social-media": "Social Media",
  "product-description": "Product Desc.",
  "email-writer": "Email Writer",
  "invoice-generator": "Invoice",
  "blog-writer": "Blog Writer",
  "translator": "Translator",
};

const toolColorMap: Record<DbToolType, string> = {
  "social-media": "text-pink-500 bg-pink-500/10",
  "product-description": "text-orange-500 bg-orange-500/10",
  "email-writer": "text-blue-500 bg-blue-500/10",
  "invoice-generator": "text-emerald-500 bg-emerald-500/10",
  "blog-writer": "text-violet-500 bg-violet-500/10",
  "translator": "text-indigo-500 bg-indigo-500/10",
};

export interface ActivityItem {
  id: string;
  tool: DbToolType;
  title: string;
  creditsUsed: number;
  createdAt: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          {activities.length > 0 && (
            <Button asChild className="h-7 text-xs text-muted-foreground" size="sm" variant="ghost">
              <Link href="/dashboard/history">
                View all
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <EmptyState
            action={{ label: "Try a Tool", href: "/dashboard/tools" }}
            description="Your AI-generated content will appear here after you use a tool."
            icon={Clock}
            size="sm"
            title="No activity yet"
          />
        ) : (
          <div className="space-y-1">
            {activities.map((item) => {
              const Icon = toolIconMap[item.tool] ?? FileText;
              const colorClass = toolColorMap[item.tool] ?? "text-gray-500 bg-gray-500/10";
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {toolLabelMap[item.tool]} &bull; {formatDate(item.createdAt)}
                    </p>
                  </div>
                  <Badge className="text-xs shrink-0 tabular-nums" variant="secondary">
                    -{item.creditsUsed} cr
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
