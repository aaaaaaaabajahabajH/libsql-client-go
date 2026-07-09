"use client";

import { Loader2, Mail, CreditCard, Sparkles, ShieldAlert } from "lucide-react";
import * as React from "react";

import { updateNotificationPrefsAction } from "@/actions/settings";
import { SaveFeedback } from "@/components/settings/save-feedback";
import { SettingsSection } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { UserPreferencesRow } from "@/types/database";

interface NotificationsFormProps {
  preferences: UserPreferencesRow;
}

interface NotificationItem {
  key: keyof Pick<
    UserPreferencesRow,
    "notify_marketing" | "notify_billing" | "notify_ai_completion" | "notify_security"
  >;
  label: string;
  description: string;
  icon: React.ElementType;
}

const NOTIFICATION_ITEMS: NotificationItem[] = [
  {
    key: "notify_marketing",
    label: "Marketing emails",
    description: "Product updates, new features, tips, and special offers.",
    icon: Mail,
  },
  {
    key: "notify_billing",
    label: "Billing emails",
    description: "Invoices, payment confirmations, and subscription changes.",
    icon: CreditCard,
  },
  {
    key: "notify_ai_completion",
    label: "AI completion emails",
    description: "Get notified when long-running AI tasks finish.",
    icon: Sparkles,
  },
  {
    key: "notify_security",
    label: "Security alerts",
    description: "Sign-in from new devices, password changes, and account activity.",
    icon: ShieldAlert,
  },
];

export function NotificationsForm({ preferences }: NotificationsFormProps) {
  const [values, setValues] = React.useState({
    notify_marketing: preferences.notify_marketing,
    notify_billing: preferences.notify_billing,
    notify_ai_completion: preferences.notify_ai_completion,
    notify_security: preferences.notify_security,
  });
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<{ success: boolean; message: string } | null>(null);

  function toggle(key: keyof typeof values) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    const result = await updateNotificationPrefsAction(values);
    setSaving(false);
    setStatus({
      success: result.success,
      message: result.success ? "Notification preferences saved." : result.error,
    });
  }

  return (
    <div className="space-y-10">
      <SettingsSection
        description="Choose which emails you want to receive. You will always receive transactional emails related to your account security."
        title="Email Notifications"
      >
        <div className="space-y-0 divide-y divide-border">
          {NOTIFICATION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium cursor-pointer" htmlFor={item.key}>
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
                <Switch
                  checked={values[item.key]}
                  id={item.key}
                  onCheckedChange={() => toggle(item.key)}
                />
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button disabled={saving} size="sm" onClick={handleSave}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save preferences
          </Button>
          {status && <SaveFeedback message={status.message} success={status.success} />}
        </div>
      </SettingsSection>
    </div>
  );
}
