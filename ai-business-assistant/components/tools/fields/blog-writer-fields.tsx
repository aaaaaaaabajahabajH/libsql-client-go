"use client";

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlogWriterFormValues } from "@/actions/tools";

interface Props {
  form: UseFormReturn<BlogWriterFormValues>;
}

export function BlogWriterFields({ form }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="bw-title">Blog Post Title</Label>
        <Input
          id="bw-title"
          placeholder="e.g. 10 Proven Strategies to Double Your SaaS Revenue in 90 Days"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bw-outline">Outline / Key Points</Label>
        <Textarea
          id="bw-outline"
          rows={4}
          placeholder="List the main sections or points to cover. One per line or as a paragraph."
          {...register("outline")}
        />
        {errors.outline && (
          <p className="text-xs text-destructive">{errors.outline.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bw-tone">Tone</Label>
          <Controller
            control={control}
            name="tone"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="bw-tone">
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

        <div className="space-y-1.5">
          <Label htmlFor="bw-words">Target Length</Label>
          <Controller
            control={control}
            name="wordCount"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="bw-words">
                  <SelectValue placeholder="Word count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">~500 words</SelectItem>
                  <SelectItem value="800">~800 words</SelectItem>
                  <SelectItem value="1200">~1,200 words</SelectItem>
                  <SelectItem value="2000">~2,000 words</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-primary"
          {...register("includeHeadings")}
        />
        <span className="text-sm">Use H2/H3 headings for structure</span>
      </label>
    </div>
  );
}
