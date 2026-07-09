"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, Zap } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";

import {
  ProductDescriptionSchema,
  type ProductDescriptionFormValues,
} from "@/actions/tools";
import { CreditDisplay, ToolOutput, ProductDescriptionFields } from "@/components/tools";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToolGeneration } from "@/hooks/use-tool-generation";
import { TOOL_CREDIT_COSTS } from "@/utils/constants";

const CREDIT_COST = TOOL_CREDIT_COSTS["product-description"];

export default function ProductDescriptionPage() {
  const { status, output, error, generate, reset } = useToolGeneration("product-description");

  const form = useForm<ProductDescriptionFormValues>({
    resolver: zodResolver(ProductDescriptionSchema),
    defaultValues: { tone: "persuasive" },
  });

  function onSubmit(values: ProductDescriptionFormValues) {
    const title = `${values.productName} — product description`;
    generate(
      {
        productName: values.productName,
        keyFeatures: values.keyFeatures,
        targetAudience: values.targetAudience,
        tone: values.tone,
      },
      title,
    );
  }

  const isGenerating = status === "generating";

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-sm shrink-0">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Product Description</h1>
          <p className="text-sm text-muted-foreground">
            Write compelling descriptions that convert browsers into buyers.
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
            <ProductDescriptionFields form={form} />

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
                    Generate Description
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

        <Card className="p-5 flex flex-col min-h-[400px]">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Output
          </h2>
          <ToolOutput
            className="flex-1"
            defaultTitle={`${form.watch("productName") ?? "Product"} — description`}
            error={error}
            output={output}
            status={status}
            tool="product-description"
            onRegenerate={form.handleSubmit(onSubmit)}
          />
        </Card>
      </div>
    </div>
  );
}
