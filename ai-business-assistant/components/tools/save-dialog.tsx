"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTitle: string;
  onSave: (title: string) => Promise<void>;
}

export function SaveDialog({ open, onOpenChange, defaultTitle, onSave }: SaveDialogProps) {
  const [title, setTitle] = React.useState(defaultTitle);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setTitle(defaultTitle);
  }, [open, defaultTitle]);

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(title.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Document</AlertDialogTitle>
          <AlertDialogDescription>
            Give this document a name so you can find it later in your saved documents.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <Label htmlFor="doc-title" className="text-sm font-medium mb-1.5 block">
            Document Title
          </Label>
          <Input
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title..."
            maxLength={300}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !saving) {
                e.preventDefault();
                handleSave(e as unknown as React.MouseEvent);
              }
            }}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Document"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
