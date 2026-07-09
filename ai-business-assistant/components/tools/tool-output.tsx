"use client";

import {
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import * as React from "react";


import { saveDocumentAction } from "@/actions/documents";
import { Button } from "@/components/ui/button";
import type { GenerationStatus } from "@/hooks/use-tool-generation";
import { cn } from "@/lib/utils";
import type { DbToolType } from "@/types/database";

import { SaveDialog } from "./save-dialog";
import { StreamingOutput } from "./streaming-output";

interface ToolOutputProps {
  status: GenerationStatus;
  output: string;
  error: string | null;
  tool: DbToolType;
  defaultTitle: string;
  onRegenerate: () => void;
  className?: string;
}

export function ToolOutput({
  status,
  output,
  error,
  tool,
  defaultTitle,
  onRegenerate,
  className,
}: ToolOutputProps) {
  const [copied, setCopied] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSave(title: string) {
    await saveDocumentAction({
      historyId: null,
      tool,
      title,
      content: output,
    });
    setSaved(true);
  }

  const isGenerating = status === "generating";
  const isDone = status === "done";
  const isError = status === "error";
  const isEmpty = status === "idle";

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Output area */}
      <div className="flex-1 min-h-0 relative">
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <Sparkles className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Your AI-generated content will appear here</p>
            <p className="text-xs mt-1 opacity-70">Fill in the form and click Generate</p>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="flex items-start gap-3 max-w-sm rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Generation failed</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
            <Button className="mt-4" size="sm" variant="outline" onClick={onRegenerate}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Try Again
            </Button>
          </div>
        )}

        {(isGenerating || isDone) && (
          <StreamingOutput
            className="absolute inset-0 p-4 rounded-lg bg-muted/20 border border-border/50"
            isStreaming={isGenerating}
            text={output}
          />
        )}
      </div>

      {/* Action bar */}
      {(isGenerating || isDone) && (
        <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button
              disabled={isGenerating}
              size="sm"
              variant="outline"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  Copy
                </>
              )}
            </Button>

            <Button
              disabled={isGenerating || saved}
              size="sm"
              variant="outline"
              onClick={() => setSaveDialogOpen(true)}
            >
              {saved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </>
              )}
            </Button>
          </div>

          <Button
            className="text-muted-foreground"
            disabled={isGenerating}
            size="sm"
            variant="ghost"
            onClick={onRegenerate}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate
          </Button>
        </div>
      )}

      <SaveDialog
        defaultTitle={defaultTitle}
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSave}
      />
    </div>
  );
}
