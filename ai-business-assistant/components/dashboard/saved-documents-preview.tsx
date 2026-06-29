import Link from "next/link";
import { BookMarked, Star, ArrowRight, FileText, Mail, Share2, Receipt, PenTool, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import type { DbToolType } from "@/types/database";

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
  "email-writer": "Email",
  "invoice-generator": "Invoice",
  "blog-writer": "Blog",
  "translator": "Translation",
};

const toolColorMap: Record<DbToolType, string> = {
  "social-media": "text-pink-500 bg-pink-500/10",
  "product-description": "text-orange-500 bg-orange-500/10",
  "email-writer": "text-blue-500 bg-blue-500/10",
  "invoice-generator": "text-emerald-500 bg-emerald-500/10",
  "blog-writer": "text-violet-500 bg-violet-500/10",
  "translator": "text-indigo-500 bg-indigo-500/10",
};

export interface SavedDocumentPreview {
  id: string;
  tool: DbToolType;
  title: string;
  isFavorite: boolean;
  updatedAt: string;
}

interface SavedDocumentsPreviewProps {
  documents: SavedDocumentPreview[];
}

export function SavedDocumentsPreview({ documents }: SavedDocumentsPreviewProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-muted-foreground" />
            Saved Documents
          </CardTitle>
          {documents.length > 0 && (
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
              <Link href="/dashboard/saved">
                View all
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {documents.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No saved documents"
            description="Save outputs from AI tools to access them here anytime."
            size="sm"
            action={{ label: "Explore Tools", href: "/dashboard/tools" }}
          />
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const Icon = toolIconMap[doc.tool];
              const colorClass = toolColorMap[doc.tool];
              return (
                <Link
                  key={doc.id}
                  href={`/dashboard/saved/${doc.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors group"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{toolLabelMap[doc.tool]}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.isFavorite && (
                      <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    )}
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {toolLabelMap[doc.tool]}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
