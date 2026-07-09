"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateProfile } from "@/actions/settings";
import { AvatarUpload } from "@/components/settings/avatar-upload";
import { SaveFeedback } from "@/components/settings/save-feedback";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
    <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
      {/* Avatar */}
      <SettingsSection noDivider title="Profile Picture">
        <AvatarUpload
          currentUrl={avatarUrl}
          displayName={profile?.full_name ?? null}
          onSuccess={setAvatarUrl}
        />
      </SettingsSection>

      {/* Personal info */}
      <SettingsSection
        description="This information is visible on your public profile."
        title="Personal Information"
      >
        <SettingsRow label="Full name">
          <Input {...register("full_name")} placeholder="Jane Smith" />
          {errors.full_name && (
            <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
          )}
        </SettingsRow>

        <SettingsRow description="Unique handle for your account. Letters, numbers, _ and -." label="Username">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <Input {...register("username")} className="pl-7" placeholder="janesmith" />
          </div>
          {errors.username && (
            <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
          )}
        </SettingsRow>

        <SettingsRow description="Managed by your auth provider." label="Email">
          <Input disabled className="bg-muted text-muted-foreground" value={userEmail} />
        </SettingsRow>

        <SettingsRow description="Up to 500 characters about yourself." label="Bio">
          <div>
            <Textarea
              {...register("bio")}
              className="resize-none"
              placeholder="Tell the world a little about yourself…"
              rows={4}
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
        description="Show your work context to teammates and collaborators."
        title="Professional Details"
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

        <SettingsRow description="Used to display dates and schedule resets." label="Timezone">
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
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save changes
        </Button>
        {status && (
          <SaveFeedback message={status.message} success={status.success} />
        )}
      </div>
    </form>
  );
}
