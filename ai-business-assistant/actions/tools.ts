"use server";

import { z } from "zod";

import type { AsyncActionResult, ToolResult, ToolType } from "@/types";

/* ─── Shared field validators ────────────────────────────────── */

const promptField = z
  .string()
  .min(10, "Prompt must be at least 10 characters")
  .max(2_000, "Prompt must not exceed 2,000 characters");

const toneField = z
  .enum(["professional", "casual", "friendly", "formal", "persuasive"])
  .default("professional");

/* ─── Per-tool schemas ───────────────────────────────────────── */

export const SocialMediaSchema = z.object({
  platform: z.enum(["twitter", "linkedin", "instagram", "facebook"]),
  topic: promptField,
  tone: toneField,
  includeHashtags: z.boolean().default(true),
  includeEmojis: z.boolean().default(true),
});

export const ProductDescriptionSchema = z.object({
  productName: z.string().min(2).max(200),
  keyFeatures: promptField,
  targetAudience: z.string().min(5).max(500),
  tone: toneField,
});

export const BlogWriterSchema = z.object({
  title: z.string().min(10).max(300),
  outline: promptField,
  tone: toneField,
  wordCount: z.enum(["500", "800", "1200", "2000"]).default("800"),
  includeHeadings: z.boolean().default(true),
});

export const EmailWriterSchema = z.object({
  emailType: z.enum(["cold-outreach", "follow-up", "newsletter", "support", "sales"]),
  recipientContext: promptField,
  senderContext: z.string().min(5).max(500),
  tone: toneField,
  includeSubjectLine: z.boolean().default(true),
});

export const InvoiceGeneratorSchema = z.object({
  clientName: z.string().min(2).max(200),
  services: z.string().min(10).max(1_000),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]).default("USD"),
  paymentTerms: z.enum(["net-15", "net-30", "net-60", "due-on-receipt"]).default("net-30"),
  additionalNotes: z.string().max(500).optional(),
});

export const TranslatorSchema = z.object({
  text: z.string().min(1).max(5_000),
  targetLanguage: z.string().min(2).max(50),
  preserveTone: z.boolean().default(true),
  formality: z.enum(["formal", "informal", "auto"]).default("auto"),
});

/* ─── Inferred form types ────────────────────────────────────── */

export type SocialMediaFormValues = z.infer<typeof SocialMediaSchema>;
export type ProductDescriptionFormValues = z.infer<typeof ProductDescriptionSchema>;
export type BlogWriterFormValues = z.infer<typeof BlogWriterSchema>;
export type EmailWriterFormValues = z.infer<typeof EmailWriterSchema>;
export type InvoiceGeneratorFormValues = z.infer<typeof InvoiceGeneratorSchema>;
export type TranslatorFormValues = z.infer<typeof TranslatorSchema>;

/* ─── Generic tool execution signature ──────────────────────── */

export async function runToolAction(
  _tool: ToolType,
  _values: Record<string, unknown>,
): AsyncActionResult<ToolResult> {
  throw new Error("runToolAction: implemented in Milestone 9");
}

export async function saveHistoryAction(
  _tool: ToolType,
  _title: string,
  _prompt: string,
  _output: string,
  _credits: number,
): AsyncActionResult<{ id: string }> {
  throw new Error("saveHistoryAction: implemented in Milestone 9");
}

export async function saveDocumentAction(
  _historyId: string,
  _title: string,
  _content: string,
  _tags: string[],
): AsyncActionResult<{ id: string }> {
  throw new Error("saveDocumentAction: implemented in Milestone 9");
}
