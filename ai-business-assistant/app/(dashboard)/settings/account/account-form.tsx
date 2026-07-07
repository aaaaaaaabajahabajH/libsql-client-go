"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-section";
import { ThemeSelector } from "@/components/settings/theme-selector";
import { DangerZone } from "@/components/settings/danger-zone";
import { SaveFeedback } from "@/components/settings/save-feedback";
import { changePassword, updateAppPreferencesAction } from "@/actions/settings";
import { LANGUAGES } from "@/utils/locale-data";

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordValues = z.infer<typeof passwordSchema>;

interface AccountFormProps {
  userEmail: string;
  currentTheme: string;
  currentLanguage: string;
}

export function AccountForm({ userEmail, currentTheme, currentLanguage }: AccountFormProps) {
  const [passwordStatus, setPasswordStatus] = React.useState<{ success: boolean; message: string } | null>(null);
  const [prefsStatus, setPrefsStatus] = React.useState<{ success: boolean; message: string } | null>(null);
  const [theme, setTheme] = React.useState(currentTheme);
  const [language, setLanguage] = React.useState(currentLanguage);
  const [savingPrefs, setSavingPrefs] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  async function onPasswordSubmit(values: PasswordValues) {
    setPasswordStatus(null);
    const result = await changePassword(values);
    setPasswordStatus({
      success: result.success,
      message: result.success ? "Password updated." : result.error,
    });
    if (result.success) reset();
  }

  async function savePreferences() {
    setSavingPrefs(true);
    setPrefsStatus(null);
    const result = await updateAppPreferencesAction({
      theme: theme as "light" | "dark" | "system",
      app_language: language,
    });
    setSavingPrefs(false);
    setPrefsStatus({
      success: result.success,
      message: result.success ? "Preferences saved." : result.error,
    });
  }

  return (
    <div className="space-y-10">
      {/* Change password */}
      <form onSubmit={handleSubmit(onPasswordSubmit)}>
        <SettingsSection
          title="Change Password"
          description="Choose a new password for your account."
        >
          <SettingsRow label="New password">
            <PasswordInput {...register("newPassword")} placeholder="Min 8 characters" />
            {errors.newPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>
            )}
          </SettingsRow>

          <SettingsRow label="Confirm password">
            <PasswordInput {...register("confirmPassword")} placeholder="Repeat new password" />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </SettingsRow>

          <div className="flex items-center gap-4 pt-1">
            <Button type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update password
            </Button>
            {passwordStatus && (
              <SaveFeedback success={passwordStatus.success} message={passwordStatus.message} />
            )}
          </div>
        </SettingsSection>
      </form>

      {/* Appearance */}
      <SettingsSection
        title="Appearance & Language"
        description="Control how the app looks and what language the interface uses."
      >
        <SettingsRow label="Theme">
          <ThemeSelector value={theme} onChange={setTheme} />
        </SettingsRow>

        <SettingsRow label="Interface language">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>

        <div className="flex items-center gap-4 pt-1">
          <Button onClick={savePreferences} disabled={savingPrefs} size="sm">
            {savingPrefs && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save preferences
          </Button>
          {prefsStatus && (
            <SaveFeedback success={prefsStatus.success} message={prefsStatus.message} />
          )}
        </div>
      </SettingsSection>

      {/* Danger zone */}
      <SettingsSection
        title="Danger Zone"
        description="Irreversible actions. Proceed with caution."
      >
        <DangerZone userEmail={userEmail} />
      </SettingsSection>
    </div>
  );
}
