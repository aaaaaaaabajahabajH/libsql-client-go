"use client";

import * as React from "react";
import { Monitor, Smartphone, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { signOutAllDevices } from "@/actions/settings";
import { useRouter } from "next/navigation";

interface SessionCardProps {
  lastSignInAt: string | null;
  email: string;
}

function parseDeviceFromUA(ua: string): { device: string; icon: React.ComponentType<{ className?: string }> } {
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    return { device: "Mobile device", icon: Smartphone };
  }
  return { device: "Desktop browser", icon: Monitor };
}

export function SessionCard({ lastSignInAt, email }: SessionCardProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const { device, icon: DeviceIcon } = parseDeviceFromUA(ua);

  const signInDisplay = lastSignInAt
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(lastSignInAt))
    : "Unknown";

  async function handleSignOutAll() {
    setLoading(true);
    setError(null);
    const result = await signOutAllDevices();
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Current session */}
      <div className="flex items-start gap-4 rounded-xl border border-border p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <DeviceIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{device}</p>
            <Badge variant="secondary" className="text-[10px]">Current</Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
          <p className="text-xs text-muted-foreground">Last sign-in: {signInDisplay}</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Sign out all */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30">
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign out from all devices
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end all active sessions across every device. You will be signed out here too
              and need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOutAll}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              {loading ? "Signing out…" : "Sign out all devices"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
