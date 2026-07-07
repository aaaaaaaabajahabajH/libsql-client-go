"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Users, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-section";
import { SaveFeedback } from "@/components/settings/save-feedback";
import { updateWorkspaceAction } from "@/actions/settings";
import type { UserPreferencesRow } from "@/types/database";

const schema = z.object({
  workspace_name: z.string().max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

interface WorkspaceFormProps {
  preferences: UserPreferencesRow;
}

export function WorkspaceForm({ preferences }: WorkspaceFormProps) {
  const [status, setStatus] = React.useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { workspace_name: preferences.workspace_name ?? "" },
  });

  async function onSubmit(values: FormValues) {
    setStatus(null);
    const result = await updateWorkspaceAction(values);
    setStatus({
      success: result.success,
      message: result.success ? "Workspace saved." : result.error,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Workspace identity */}
      <SettingsSection
        title="Workspace Identity"
        description="Personalise your workspace name for a branded experience."
      >
        <SettingsRow
          label="Workspace name"
          description="Displayed in the sidebar and exported documents."
        >
          <Input
            {...register("workspace_name")}
            placeholder="Acme Inc."
          />
          {errors.workspace_name && (
            <p className="mt-1 text-xs text-destructive">{errors.workspace_name.message}</p>
          )}
        </SettingsRow>

        <div className="flex items-center gap-4 pt-1">
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save workspace
          </Button>
          {status && <SaveFeedback success={status.success} message={status.message} />}
        </div>
      </SettingsSection>

      {/* Team (future) */}
      <SettingsSection
        title="Team Members"
        description="Invite colleagues to collaborate in your workspace."
      >
        <div className="rounded-xl border border-dashed border-border p-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Team invitations</p>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-user workspaces are available on the Enterprise plan.
            </p>
          </div>
          <Badge variant="secondary" className="text-[11px]">Coming soon</Badge>
        </div>
      </SettingsSection>

      {/* API Keys (future) */}
      <SettingsSection
        title="API Access"
        description="Use your API key to integrate AI Business Assistant into your own products."
      >
        <div className="rounded-xl border border-dashed border-border p-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Key className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">API Keys</p>
            <p className="text-xs text-muted-foreground mt-1">
              Programmatic access is available on the Pro and Enterprise plans.
            </p>
          </div>
          <Badge variant="secondary" className="text-[11px]">Coming soon</Badge>
        </div>
      </SettingsSection>
    </form>
  );
}
