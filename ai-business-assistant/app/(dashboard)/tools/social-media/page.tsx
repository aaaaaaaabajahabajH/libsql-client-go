"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Share2, Loader2, Zap } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  SocialMediaSchema,
  type SocialMediaFormValues,
} from "@/actions/tools";
import { CreditDisplay, ToolOutput, SocialMediaFields } from "@/components/tools";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToolGeneration } from "@/hooks/use-tool-generation";
import { TOOL_CREDIT_COSTS } from "@/utils/constants";

const CREDIT_COST = TOOL_CREDIT_COSTS["social-media"];

export default function SocialMediaPage() {
  const { status, output, error, generate, reset } = useToolGeneration("social-media");

  const form = useForm<SocialMediaFormValues>({
    resolver: zodResolver(SocialMediaSchema),
    defaultValues: {
      platform: "linkedin",
      tone: "professional",
      includeHashtags: true,
      includeEmojis: false,
    },
  });

  function onSubmit(values: SocialMediaFormValues) {
    const title = `${values.platform} post — ${values.topic.slice(0, 60)}`;
    generate(
      {
        platform: values.platform,
        topic: values.topic,
        tone: values.tone,
        includeHashtags: values.includeHashtags,
        includeEmojis: values.includeEmojis,
      },
      title,
    );
  }

  const isGenerating = status === "generating";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-sm shrink-0">
          <Share2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Social Media Generator</h1>
          <p className="text-sm text-muted-foreground">
            Create viral posts for X, LinkedIn, Instagram, and Facebook in seconds.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input form */}
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Input
            </h2>
            <CreditDisplay balance={50} cost={CREDIT_COST} />
          </div>

          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
            <SocialMediaFields form={form} />

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 font-semibold shadow-glow-sm"
                disabled={isGenerating}
                type="submit"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Post
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

        {/* Output panel */}
        <Card className="p-5 flex flex-col min-h-[400px]">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Output
          </h2>
          <ToolOutput
            className="flex-1"
            defaultTitle={`Social media post — ${form.watch("platform") ?? "linkedin"}`}
            error={error}
            output={output}
            status={status}
            tool="social-media"
            onRegenerate={form.handleSubmit(onSubmit)}
          />
        </Card>
      </div>
    </div>
  );
}
