"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-section";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { SaveFeedback } from "@/components/settings/save-feedback";
import { updateProfile } from "@/actions/settings";
import type { ProfileRow } from "@/types/database";
import { TIMEZONES, COUNTRIES } from "@/utils/locale-data";

const schema = z.object({
  full_name: z.string().max(100).optional(),
  username: z
    .string()
    .min(3, "Min 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, _ and - only")
    .optional()
    .or(z.literal("")),
  job_title: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  company: z.string().max(100).optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  country: z.string().optional(),
  timezone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ProfileFormProps {
  profile: ProfileRow | null;
  userEmail: string;
}

export function ProfileForm({ profile, userEmail }: ProfileFormProps) {
  const [status, setStatus] = React.useState<{ success: boolean; message: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState(profile?.avatar_url ?? null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      username: profile?.username ?? "",
      job_title: profile?.job_title ?? "",
      bio: profile?.bio ?? "",
      company: profile?.company ?? "",
      website: profile?.website ?? "",
      country: profile?.country ?? "",
      timezone: profile?.timezone ?? "UTC",
    },
  });

  const bio = watch("bio") ?? "";

  async function onSubmit(values: FormValues) {
    setStatus(null);
    const result = await updateProfile(values);
    setStatus({
      success: result.success,
      message: result.success ? "Profile saved." : result.error,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Avatar */}
      <SettingsSection title="Profile Picture" noDivider>
        <AvatarUpload
          currentUrl={avatarUrl}
          displayName={profile?.full_name ?? null}
          onSuccess={setAvatarUrl}
        />
      </SettingsSection>

      {/* Personal info */}
      <SettingsSection
        title="Personal Information"
        description="This information is visible on your public profile."
      >
        <SettingsRow label="Full name">
          <Input {...register("full_name")} placeholder="Jane Smith" />
          {errors.full_name && (
            <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </SettingsRow>

        <SettingsRow label="Username" description="Unique handle for your account. Letters, numbers, _ and -.">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input {...register("username")} placeholder="janesmith" className="pl-7" />
          </div>
          {errors.username && (
            <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
          )}
        </SettingsRow>

        <SettingsRow label="Email" description="Managed by your auth provider.">
          <Input value={userEmail} disabled className="bg-muted text-muted-foreground" />
        </SettingsRow>

        <SettingsRow label="Bio" description="Up to 500 characters about yourself.">
          <div>
            <Textarea
              {...register("bio")}
              rows={4}
              placeholder="Tell the world a little about yourself…"
              className="resize-none"
            />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">
              {bio.length} / 500
            </p>
          </div>
          {errors.bio && (
            <p className="text-xs text-destructive">{errors.bio.message}</p>
          )}
        </SettingsRow>
      </SettingsSection>

      {/* Professional info */}
      <SettingsSection
        title="Professional Details"
        description="Show your work context to teammates and collaborators."
      >
        <SettingsRow label="Job title">
          <Input {...register("job_title")} placeholder="Product Manager" />
          {errors.job_title && (
            <p className="mt-1 text-xs text-destructive">{errors.job_title.message}</p>
          )}
        </SettingsRow>

        <SettingsRow label="Company">
          <Input {...register("company")} placeholder="Acme Inc." />
          {errors.company && (
            <p className="mt-1 text-xs text-destructive">{errors.company.message}</p>
          )}
        </SettingsRow>

        <SettingsRow label="Website">
          <Input {...register("website")} placeholder="https://yoursite.com" type="url" />
          {errors.website && (
            <p className="mt-1 text-xs text-destructive">{errors.website.message}</p>
          )}
        </SettingsRow>
      </SettingsSection>

      {/* Location */}
      <SettingsSection title="Location & Time">
        <SettingsRow label="Country">
          <Select
            value={watch("country") ?? ""}
            onValueChange={(v) => setValue("country", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>

        <SettingsRow label="Timezone" description="Used to display dates and schedule resets.">
          <Select
            value={watch("timezone") ?? "UTC"}
            onValueChange={(v) => setValue("timezone", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
      </SettingsSection>

      {/* Footer */}
      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save changes
        </Button>
        {status && (
          <SaveFeedback success={status.success} message={status.message} />
        )}
      </div>
    </form>
  );
}
