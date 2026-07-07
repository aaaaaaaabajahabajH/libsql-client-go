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
import type { TranslatorFormValues } from "@/actions/tools";

const POPULAR_LANGUAGES = [
  "Spanish", "French", "German", "Italian", "Portuguese",
  "Dutch", "Polish", "Russian", "Japanese", "Chinese (Simplified)",
  "Chinese (Traditional)", "Korean", "Arabic", "Hindi", "Turkish",
  "Swedish", "Norwegian", "Danish", "Finnish", "Greek",
];

interface Props {
  form: UseFormReturn<TranslatorFormValues>;
}

export function TranslatorFields({ form }: Props) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const text = watch("text") ?? "";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="tr-text">Text to Translate</Label>
          <span className="text-xs text-muted-foreground">
            {text.length} / 5,000
          </span>
        </div>
        <Textarea
          id="tr-text"
          rows={5}
          placeholder="Paste the text you want to translate here..."
          {...register("text")}
        />
        {errors.text && (
          <p className="text-xs text-destructive">{errors.text.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tr-lang">Target Language</Label>
        <Controller
          control={control}
          name="targetLanguage"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="tr-lang">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.targetLanguage && (
          <p className="text-xs text-destructive">{errors.targetLanguage.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tr-formality">Formality</Label>
        <Controller
          control={control}
          name="formality"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="tr-formality">
                <SelectValue placeholder="Select formality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (match source)</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="informal">Informal</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-primary"
          {...register("preserveTone")}
        />
        <span className="text-sm">Preserve original tone and voice</span>
      </label>
    </div>
  );
}
