import { FileText, Mail, Share2, Receipt, PenTool, Globe, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format";

const toolIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "social-media": Share2,
  "product-description": FileText,
  "email-writer": Mail,
  "invoice-generator": Receipt,
  "blog-writer": PenTool,
  "translator": Globe,
};

const toolLabelMap: Record<string, string> = {
  "social-media": "Social Media",
  "product-description": "Product Desc.",
  "email-writer": "Email Writer",
  "invoice-generator": "Invoice",
  "blog-writer": "Blog Writer",
  "translator": "Translator",
};

const toolColorMap: Record<string, string> = {
  "social-media": "text-pink-500 bg-pink-100 dark:bg-pink-900/30",
  "product-description": "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
  "email-writer": "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
  "invoice-generator": "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
  "blog-writer": "text-violet-500 bg-violet-100 dark:bg-violet-900/30",
  "translator": "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
};

export interface ActivityItem {
  id: string;
  tool: string;
  title: string;
  credits: number;
  created_at: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="h-9 w-9 rounded-lg bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted" />
          </div>
          <div className="h-5 w-16 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start using AI tools to see your history here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((item) => {
              const Icon = toolIconMap[item.tool] ?? FileText;
              const colorClass = toolColorMap[item.tool] ?? "text-gray-500 bg-gray-100";
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg hover:bg-muted/50 transition-colors p-1.5 -mx-1.5"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {toolLabelMap[item.tool] ?? item.tool} &bull;{" "}
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    -{item.credits} cr
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

export { ActivitySkeleton };
