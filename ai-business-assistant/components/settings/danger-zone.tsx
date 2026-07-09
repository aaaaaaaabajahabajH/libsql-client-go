"use client";

import { Trash2, Download, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import { deleteAccount, exportUserData } from "@/actions/settings";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DangerZoneProps {
  userEmail: string;
}

export function DangerZone({ userEmail }: DangerZoneProps) {
  const router = useRouter();
  const [confirmEmail, setConfirmEmail] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    const result = await exportUserData();
    setExporting(false);

    if (!result.success) {
      setExportError(result.error);
      return;
    }

    const blob = new Blob([result.data.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteAccount();
    setDeleting(false);

    if (!result.success) {
      setDeleteError(result.error);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Export data */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium">Export your data</p>
          <p className="text-xs text-muted-foreground">
            Download a JSON archive of your profile, history, and saved documents.
          </p>
          {exportError && <p className="text-xs text-destructive">{exportError}</p>}
        </div>
        <Button
          className="shrink-0"
          disabled={exporting}
          size="sm"
          variant="outline"
          onClick={handleExport}
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-1.5" />
          )}
          {exporting ? "Exporting…" : "Export"}
        </Button>
      </div>

      {/* Delete account */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-destructive">Delete account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>

        {deleteError && <p className="text-xs text-destructive">{deleteError}</p>}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account, all history, saved documents, and billing
                data. Type your email address to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              className="mt-1"
              placeholder={userEmail}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
            <AlertDialogFooter className="mt-2">
              <AlertDialogCancel onClick={() => setConfirmEmail("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={confirmEmail !== userEmail || deleting}
                onClick={handleDelete}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {deleting ? "Deleting…" : "Yes, delete my account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
