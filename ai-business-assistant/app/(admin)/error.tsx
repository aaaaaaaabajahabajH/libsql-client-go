"use client";

import * as Sentry from "@sentry/nextjs";
import { ShieldAlert, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh] p-8">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-7 w-7 text-destructive" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Admin panel error</h2>
          <p className="text-sm text-muted-foreground">
            An error occurred in the admin panel. This has been reported automatically.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono mt-2">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button size="sm" onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Try again
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin">Back to Admin</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
