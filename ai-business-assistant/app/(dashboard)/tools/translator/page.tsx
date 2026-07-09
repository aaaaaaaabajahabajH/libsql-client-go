"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Globe, Loader2, Zap } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  TranslatorSchema,
  type TranslatorFormValues,
} from "@/actions/tools";
import { CreditDisplay, ToolOutput, TranslatorFields } from "@/components/tools";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToolGeneration } from "@/hooks/use-tool-generation";
import { TOOL_CREDIT_COSTS } from "@/utils/constants";

const CREDIT_COST = TOOL_CREDIT_COSTS["translator"];

export default function TranslatorPage() {
  const { status, output, error, generate, reset } = useToolGeneration("translator");

  const form = useForm<TranslatorFormValues>({
    resolver: zodResolver(TranslatorSchema),
    defaultValues: {
      targetLanguage: "Spanish",
      preserveTone: true,
      formality: "auto",
    },
  });

  function onSubmit(values: TranslatorFormValues) {
    const title = `Translation to ${values.targetLanguage} — ${new Date().toLocaleDateString()}`;
    generate(
      {
        text: values.text,
        targetLanguage: values.targetLanguage,
        preserveTone: values.preserveTone,
        formality: values.formality,
      },
      title,
    );
  }

  const isGenerating = status === "generating";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-sm shrink-0">
          <Globe className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Text Translator</h1>
          <p className="text-sm text-muted-foreground">
            Translate into 50+ languages while preserving tone, nuance, and context.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Input
            </h2>
            <CreditDisplay balance={50} cost={CREDIT_COST} />
          </div>

          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <TranslatorFields form={form} />

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 font-semibold shadow-glow-sm"
                disabled={isGenerating}
                type="submit"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Translating…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Translate
                  </>
                )}
              </Button>
              {status !== "idle" && (
                <Button type="button" variant="outline" onClick={reset}>
                  Clear
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="p-5 flex flex-col min-h-[420px]">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Output
          </h2>
          <ToolOutput
            className="flex-1"
            defaultTitle={`Translation to ${form.watch("targetLanguage") ?? "Spanish"}`}
            error={error}
            output={output}
            status={status}
            tool="translator"
            onRegenerate={form.handleSubmit(onSubmit)}
          />
        </Card>
      </div>
    </div>
  );
}
