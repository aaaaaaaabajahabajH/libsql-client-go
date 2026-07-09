"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Users, Key } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateWorkspaceAction } from "@/actions/settings";
import { SaveFeedback } from "@/components/settings/save-feedback";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
      {/* Workspace identity */}
      <SettingsSection
        description="Personalise your workspace name for a branded experience."
        title="Workspace Identity"
      >
        <SettingsRow
          description="Displayed in the sidebar and exported documents."
          label="Workspace name"
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
          <Button disabled={isSubmitting} size="sm" type="submit">
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save workspace
          </Button>
          {status && <SaveFeedback message={status.message} success={status.success} />}
        </div>
      </SettingsSection>

      {/* Team (future) */}
      <SettingsSection
        description="Invite colleagues to collaborate in your workspace."
        title="Team Members"
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
          <Badge className="text-[11px]" variant="secondary">Coming soon</Badge>
        </div>
      </SettingsSection>

      {/* API Keys (future) */}
      <SettingsSection
        description="Use your API key to integrate AI Business Assistant into your own products."
        title="API Access"
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
          <Badge className="text-[11px]" variant="secondary">Coming soon</Badge>
        </div>
      </SettingsSection>
    </form>
  );
}
