"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveFeedbackProps {
  success: boolean | null;
  message?: string;
  className?: string;
}

export function SaveFeedback({ success, message, className }: SaveFeedbackProps) {
  if (success === null) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm animate-in fade-in slide-in-from-bottom-1 duration-200",
        success
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive",
        className,
      )}
    >
      {success ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{message ?? (success ? "Saved successfully" : "Failed to save")}</span>
    </div>
  );
}
