"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2, Zap } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  EmailWriterSchema,
  type EmailWriterFormValues,
} from "@/actions/tools";
import { CreditDisplay, ToolOutput, EmailWriterFields } from "@/components/tools";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToolGeneration } from "@/hooks/use-tool-generation";
import { TOOL_CREDIT_COSTS } from "@/utils/constants";

const CREDIT_COST = TOOL_CREDIT_COSTS["email-writer"];

const EMAIL_TYPE_LABELS: Record<string, string> = {
  "cold-outreach": "cold outreach",
  "follow-up": "follow-up",
  newsletter: "newsletter",
  support: "support",
  sales: "sales",
};

export default function EmailWriterPage() {
  const { status, output, error, generate, reset } = useToolGeneration("email-writer");

  const form = useForm<EmailWriterFormValues>({
    resolver: zodResolver(EmailWriterSchema),
    defaultValues: {
      emailType: "cold-outreach",
      tone: "professional",
      includeSubjectLine: true,
    },
  });

  function onSubmit(values: EmailWriterFormValues) {
    const typeLabel = EMAIL_TYPE_LABELS[values.emailType] ?? values.emailType;
    const title = `${typeLabel} email — ${new Date().toLocaleDateString()}`;
    generate(
      {
        emailType: values.emailType,
        recipientContext: values.recipientContext,
        senderContext: values.senderContext,
        tone: values.tone,
        includeSubjectLine: values.includeSubjectLine,
      },
      title,
    );
  }

  const isGenerating = status === "generating";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm shrink-0">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Email Writer</h1>
          <p className="text-sm text-muted-foreground">
            Draft professional emails and campaigns that get responses.
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
            <EmailWriterFields form={form} />

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 font-semibold shadow-glow-sm"
                disabled={isGenerating}
                type="submit"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Writing…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Write Email
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
            defaultTitle={`Email — ${form.watch("emailType") ?? "draft"}`}
            error={error}
            output={output}
            status={status}
            tool="email-writer"
            onRegenerate={form.handleSubmit(onSubmit)}
          />
        </Card>
      </div>
    </div>
  );
}
