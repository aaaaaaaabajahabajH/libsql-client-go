"use client";

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SocialMediaFormValues } from "@/actions/tools";

interface Props {
  form: UseFormReturn<SocialMediaFormValues>;
}

export function SocialMediaFields({ form }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sm-platform">Platform</Label>
        <Controller
          control={control}
          name="platform"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="sm-platform">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">X / Twitter</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sm-topic">Topic or message</Label>
        <Textarea
          id="sm-topic"
          rows={3}
          placeholder="What do you want to post about? Be specific — include key points, products, or announcements."
          {...register("topic")}
        />
        {errors.topic && (
          <p className="text-xs text-destructive">{errors.topic.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sm-tone">Tone</Label>
        <Controller
          control={control}
          name="tone"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="sm-tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-primary"
            {...register("includeHashtags")}
          />
          <span className="text-sm">Include hashtags</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border accent-primary"
            {...register("includeEmojis")}
          />
          <span className="text-sm">Include emojis</span>
        </label>
      </div>
    </div>
  );
}
