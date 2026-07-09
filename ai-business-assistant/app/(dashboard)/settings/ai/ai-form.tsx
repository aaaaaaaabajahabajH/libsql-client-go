"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { updateAIPreferencesAction } from "@/actions/settings";
import { SaveFeedback } from "@/components/settings/save-feedback";
import { SettingsSection, SettingsRow } from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { UserPreferencesRow } from "@/types/database";
import { AI_LANGUAGES } from "@/utils/locale-data";

const schema = z.object({
  ai_provider: z.enum(["openai", "anthropic", "google"]),
  ai_model: z.string().min(1),
  temperature: z.number().min(0).max(1),
  max_tokens: z.number().int().min(256).max(16384),
  default_language: z.string(),
  writing_tone: z.enum(["professional", "casual", "friendly", "formal", "persuasive"]),
});

type FormValues = z.infer<typeof schema>;

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google AI" },
] as const;

const MODELS: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  anthropic: [
    { value: "claude-opus-4-8", label: "Claude Opus 4.8" },
    { value: "claude-sonnet-5", label: "Claude Sonnet 5" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  google: [
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  ],
};

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "formal", label: "Formal" },
  { value: "persuasive", label: "Persuasive" },
] as const;

const TOKEN_OPTIONS = [256, 512, 1024, 2048, 4096, 8192, 16384];

interface AIPreferencesFormProps {
  preferences: UserPreferencesRow;
}

export function AIPreferencesForm({ preferences }: AIPreferencesFormProps) {
  const [status, setStatus] = React.useState<{ success: boolean; message: string } | null>(null);

  const {
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ai_provider: preferences.ai_provider,
      ai_model: preferences.ai_model,
      temperature: preferences.temperature,
      max_tokens: preferences.max_tokens,
      default_language: preferences.default_language,
      writing_tone: preferences.writing_tone,
    },
  });

  const provider = watch("ai_provider");
  const temperature = watch("temperature");

  const models = MODELS[provider] ?? MODELS.openai;

  function creativityLabel(t: number): string {
    if (t <= 0.2) return "Precise";
    if (t <= 0.4) return "Balanced";
    if (t <= 0.6) return "Creative";
    if (t <= 0.8) return "Very creative";
    return "Experimental";
  }

  async function onSubmit(values: FormValues) {
    setStatus(null);
    const result = await updateAIPreferencesAction(values);
    setStatus({
      success: result.success,
      message: result.success ? "AI preferences saved." : result.error,
    });
  }

  return (
    <form className="space-y-10" onSubmit={handleSubmit(onSubmit)}>
      <SettingsSection
        description="Choose which AI provider and model powers your content generation."
        title="AI Engine"
      >
        <SettingsRow label="Provider">
          <Controller
            control={control}
            name="ai_provider"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  const first = MODELS[v]?.[0]?.value ?? "";
                  setValue("ai_model", first);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </SettingsRow>

        <SettingsRow label="Model">
          <Controller
            control={control}
            name="ai_model"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        description="Fine-tune how the AI produces content."
        title="Generation Settings"
      >
        <SettingsRow
          description="Higher values make output more creative and varied. Lower values keep it predictable."
          label="Creativity"
        >
          <div className="space-y-3">
            <Controller
              control={control}
              name="temperature"
              render={({ field }) => (
                <Slider
                  max={1}
                  min={0}
                  step={0.1}
                  value={[field.value]}
                  onValueChange={([v]) => field.onChange(v)}
                />
              )}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Precise</span>
              <span className="font-medium text-foreground">
                {temperature.toFixed(1)} — {creativityLabel(temperature)}
              </span>
              <span>Experimental</span>
            </div>
          </div>
        </SettingsRow>

        <SettingsRow
          description="Maximum number of tokens the AI will generate per request."
          label="Max output length"
        >
          <Controller
            control={control}
            name="max_tokens"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOKEN_OPTIONS.map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      {t.toLocaleString()} tokens
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </SettingsRow>

        <SettingsRow
          description="Language used when generating content unless overridden per-tool."
          label="Default language"
        >
          <Controller
            control={control}
            name="default_language"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {AI_LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </SettingsRow>

        <SettingsRow
          description="Default tone applied to generated content."
          label="Writing tone"
        >
          <Controller
            control={control}
            name="writing_tone"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </SettingsRow>
      </SettingsSection>

      <div className="flex items-center gap-4 pt-2">
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save AI preferences
        </Button>
        {status && <SaveFeedback message={status.message} success={status.success} />}
      </div>
    </form>
  );
}
