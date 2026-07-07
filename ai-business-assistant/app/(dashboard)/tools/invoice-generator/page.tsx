"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Receipt, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditDisplay, ToolOutput, InvoiceGeneratorFields } from "@/components/tools";
import { useToolGeneration } from "@/hooks/use-tool-generation";
import {
  InvoiceGeneratorSchema,
  type InvoiceGeneratorFormValues,
} from "@/actions/tools";
import { TOOL_CREDIT_COSTS } from "@/utils/constants";

const CREDIT_COST = TOOL_CREDIT_COSTS["invoice-generator"];

export default function InvoiceGeneratorPage() {
  const { status, output, error, generate, reset } = useToolGeneration("invoice-generator");

  const form = useForm<InvoiceGeneratorFormValues>({
    resolver: zodResolver(InvoiceGeneratorSchema),
    defaultValues: {
      currency: "USD",
      paymentTerms: "net-30",
    },
  });

  function onSubmit(values: InvoiceGeneratorFormValues) {
    const title = `Invoice — ${values.clientName} — ${new Date().toLocaleDateString()}`;
    generate(
      {
        clientName: values.clientName,
        services: values.services,
        currency: values.currency,
        paymentTerms: values.paymentTerms,
        additionalNotes: values.additionalNotes,
      },
      title,
    );
  }

  const isGenerating = status === "generating";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm shrink-0">
          <Receipt className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Invoice Generator</h1>
          <p className="text-sm text-muted-foreground">
            Generate professional invoices and business documents in seconds.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              Input
            </h2>
            <CreditDisplay cost={CREDIT_COST} balance={50} />
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <InvoiceGeneratorFields form={form} />

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={isGenerating}
                className="flex-1 font-semibold shadow-glow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Invoice
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
            status={status}
            output={output}
            error={error}
            tool="invoice-generator"
            defaultTitle={`Invoice — ${form.watch("clientName") ?? "client"}`}
            onRegenerate={form.handleSubmit(onSubmit)}
            className="flex-1"
          />
        </Card>
      </div>
    </div>
  );
}
