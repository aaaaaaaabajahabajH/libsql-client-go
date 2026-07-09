"use client";

import { Loader2, Monitor, ShieldCheck, ShieldOff, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { signOutAllDevices } from "@/actions/settings";
import { SaveFeedback } from "@/components/settings/save-feedback";
import { SettingsSection } from "@/components/settings/settings-section";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface SecurityFormProps {
  userEmail: string;
  lastSignIn: string | null;
  isMfaEnabled: boolean;
  totpFactorId: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function SecurityForm({
  userEmail,
  lastSignIn,
  isMfaEnabled,
  totpFactorId,
}: SecurityFormProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);
  const [signOutStatus, setSignOutStatus] = React.useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // 2FA enrollment state
  const [mfaEnabled, setMfaEnabled] = React.useState(isMfaEnabled);
  const [factorId, setFactorId] = React.useState<string | null>(totpFactorId);
  const [showMfaDialog, setShowMfaDialog] = React.useState(false);
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [secret, setSecret] = React.useState<string | null>(null);
  const [verifyCode, setVerifyCode] = React.useState("");
  const [enrollFactorId, setEnrollFactorId] = React.useState<string | null>(null);
  const [mfaError, setMfaError] = React.useState<string | null>(null);
  const [mfaLoading, setMfaLoading] = React.useState(false);

  async function handleSignOutAll() {
    setSigningOut(true);
    setSignOutStatus(null);
    const result = await signOutAllDevices();
    if (result.success) {
      router.push("/login");
    } else {
      setSigningOut(false);
      setSignOutStatus({ success: false, message: result.error });
    }
  }

  async function startMfaEnrollment() {
    setMfaError(null);
    setVerifyCode("");
    setMfaLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    setMfaLoading(false);
    if (error || !data) {
      setMfaError(error?.message ?? "Failed to start 2FA enrollment.");
      return;
    }
    setEnrollFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setShowMfaDialog(true);
  }

  async function verifyMfaEnrollment() {
    if (!enrollFactorId || verifyCode.length !== 6) return;
    setMfaError(null);
    setMfaLoading(true);
    const supabase = createClient();
    const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({
      factorId: enrollFactorId,
    });
    if (challengeErr || !challengeData) {
      setMfaLoading(false);
      setMfaError(challengeErr?.message ?? "Challenge failed.");
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId: enrollFactorId,
      challengeId: challengeData.id,
      code: verifyCode,
    });
    setMfaLoading(false);
    if (verifyErr) {
      setMfaError("Invalid code. Please try again.");
      return;
    }
    setFactorId(enrollFactorId);
    setMfaEnabled(true);
    setShowMfaDialog(false);
    setQrCode(null);
    setSecret(null);
    setVerifyCode("");
  }

  async function disableMfa() {
    if (!factorId) return;
    setMfaLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setMfaLoading(false);
    if (error) {
      setMfaError(error.message);
      return;
    }
    setMfaEnabled(false);
    setFactorId(null);
  }

  return (
    <div className="space-y-10">
      {/* Active session */}
      <SettingsSection
        description="Your current browser session and recent sign-in activity."
        title="Active Session"
      >
        <div className="rounded-xl border border-border p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">Current session</p>
              <Badge className="text-[11px]" variant="secondary">Active now</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
            <p className="text-xs text-muted-foreground">Last sign-in: {formatDate(lastSignIn)}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={signingOut} size="sm" variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out all devices
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out all devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately end all active sessions including this one. You will be
                  redirected to the login page.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={signingOut} onClick={handleSignOutAll}>
                  {signingOut && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Sign out all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {signOutStatus && (
            <SaveFeedback message={signOutStatus.message} success={signOutStatus.success} />
          )}
        </div>
      </SettingsSection>

      {/* Two-factor authentication */}
      <SettingsSection
        description="Add an extra layer of security to your account using an authenticator app."
        title="Two-Factor Authentication"
      >
        <div className="rounded-xl border border-border p-4 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              mfaEnabled ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
            }`}
          >
            {mfaEnabled ? (
              <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">Authenticator app (TOTP)</p>
              {mfaEnabled ? (
                <Badge className="text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                  Enabled
                </Badge>
              ) : (
                <Badge className="text-[11px]" variant="secondary">Disabled</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mfaEnabled
                ? "Your account is protected with two-factor authentication."
                : "Use Google Authenticator, Authy, or any TOTP app to generate codes."}
            </p>
          </div>
        </div>

        {mfaError && <p className="text-xs text-destructive">{mfaError}</p>}

        <div className="flex items-center gap-3 pt-2">
          {mfaEnabled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={mfaLoading} size="sm" variant="outline">
                  {mfaLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Disable 2FA
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disable two-factor authentication?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Removing 2FA will make your account less secure. You can re-enable it at any
                    time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={disableMfa}
                  >
                    Disable 2FA
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button disabled={mfaLoading} size="sm" onClick={startMfaEnrollment}>
              {mfaLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enable 2FA
            </Button>
          )}
        </div>
      </SettingsSection>

      {/* 2FA setup dialog */}
      <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up two-factor authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="2FA QR Code" className="h-48 w-48 rounded-lg border border-border" src={qrCode} />
              </div>
            )}
            {secret && (
              <div className="rounded-md bg-muted px-3 py-2 text-center">
                <p className="text-[11px] text-muted-foreground mb-1">Manual entry key</p>
                <code className="text-xs font-mono break-all">{secret}</code>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Verification code</label>
              <Input
                className="text-center text-lg tracking-widest"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              />
              {mfaError && <p className="text-xs text-destructive">{mfaError}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMfaDialog(false);
                setQrCode(null);
                setSecret(null);
                setVerifyCode("");
                setMfaError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={verifyCode.length !== 6 || mfaLoading}
              onClick={verifyMfaEnrollment}
            >
              {mfaLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Verify & enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
