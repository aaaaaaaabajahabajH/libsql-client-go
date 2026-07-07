"use client";

import * as React from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { uploadAvatar } from "@/actions/settings";

interface AvatarUploadProps {
  currentUrl: string | null;
  displayName: string | null;
  onSuccess?: (url: string) => void;
}

export function AvatarUpload({ currentUrl, displayName, onSuccess }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentUrl);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    const local = URL.createObjectURL(file);
    setPreviewUrl(local);

    const fd = new FormData();
    fd.append("avatar", file);

    setUploading(true);
    const result = await uploadAvatar(fd);
    setUploading(false);

    if (result.success) {
      onSuccess?.(result.data.url);
    } else {
      setError(result.error);
      setPreviewUrl(currentUrl);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <Avatar className="h-20 w-20 border-2 border-border">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt={displayName ?? "Avatar"} />
          ) : null}
          <AvatarFallback className="text-lg font-semibold bg-muted">
            {initials}
          </AvatarFallback>
        </Avatar>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          aria-label="Upload new avatar"
        >
          <Camera className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Uploading…
            </>
          ) : (
            "Change photo"
          )}
        </Button>
        <p className="text-[11px] text-muted-foreground">JPG, PNG, WebP or GIF · Max 2 MB</p>
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
