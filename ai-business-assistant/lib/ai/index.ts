export { getProvider } from "./providers/factory";
export type { AIProvider, AIRequest } from "./providers/types";

export {
  buildSocialMediaPrompt,
  buildProductDescriptionPrompt,
  buildBlogWriterPrompt,
  buildEmailWriterPrompt,
  buildInvoiceGeneratorPrompt,
  buildTranslatorPrompt,
} from "./prompts";
export type { BuiltPrompt } from "./prompts";

import type { BuiltPrompt } from "./prompts";
import type { DbToolType } from "@/types/database";

import { buildSocialMediaPrompt } from "./prompts/social-media";
import { buildProductDescriptionPrompt } from "./prompts/product-description";
import { buildBlogWriterPrompt } from "./prompts/blog-writer";
import { buildEmailWriterPrompt } from "./prompts/email-writer";
import { buildInvoiceGeneratorPrompt } from "./prompts/invoice-generator";
import { buildTranslatorPrompt } from "./prompts/translator";

export function buildPrompt(
  tool: DbToolType,
  input: Record<string, unknown>,
): BuiltPrompt {
  switch (tool) {
    case "social-media":
      return buildSocialMediaPrompt(input as unknown as Parameters<typeof buildSocialMediaPrompt>[0]);
    case "product-description":
      return buildProductDescriptionPrompt(input as unknown as Parameters<typeof buildProductDescriptionPrompt>[0]);
    case "blog-writer":
      return buildBlogWriterPrompt(input as unknown as Parameters<typeof buildBlogWriterPrompt>[0]);
    case "email-writer":
      return buildEmailWriterPrompt(input as unknown as Parameters<typeof buildEmailWriterPrompt>[0]);
    case "invoice-generator":
      return buildInvoiceGeneratorPrompt(input as unknown as Parameters<typeof buildInvoiceGeneratorPrompt>[0]);
    case "translator":
      return buildTranslatorPrompt(input as unknown as Parameters<typeof buildTranslatorPrompt>[0]);
  }
}
