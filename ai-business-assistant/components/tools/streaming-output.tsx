"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface StreamingOutputProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingOutput({ text, isStreaming, className }: StreamingOutputProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text, isStreaming]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-y-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed",
        className,
      )}
    >
      {text}
      {isStreaming && (
        <span className="inline-block h-4 w-0.5 ml-0.5 bg-primary align-text-bottom animate-pulse" />
      )}
    </div>
  );
}
