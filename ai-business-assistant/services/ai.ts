/**
 * AI Service — thin adapter between tool Server Actions and the AI provider.
 *
 * Architectural note: this service is the ONLY place that knows which
 * AI provider (OpenAI, Anthropic, etc.) is used. Swapping providers
 * means changing only this file.
 *
 * Implementation: Milestone 9
 */

import type { ToolType } from "@/types";

/* ─── Interfaces ─────────────────────────────────────────────── */

export interface AIGenerateRequest {
  tool: ToolType;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIGenerateResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: "stop" | "length" | "error";
}

/* ─── System prompt builders ─────────────────────────────────── */

export const SYSTEM_PROMPTS: Record<ToolType, string> = {
  "social-media":
    "You are an expert social media copywriter. Create engaging, platform-native content that drives high engagement. Match the platform's native style and best practices.",
  "product-description":
    "You are a conversion-focused e-commerce copywriter. Write product descriptions that highlight benefits over features, build desire, and drive purchases.",
  "blog-writer":
    "You are an experienced SEO content writer. Create well-structured, engaging blog posts that provide genuine value, rank in search engines, and keep readers interested.",
  "email-writer":
    "You are a professional business email writer. Craft clear, concise, and persuasive emails tailored to the recipient and context.",
  "invoice-generator":
    "You are a professional business document writer. Generate clear, well-structured invoice content in a professional format.",
  translator:
    "You are a professional translator with deep cultural knowledge. Translate text accurately while preserving the original tone, context, and nuance.",
};

/* ─── AI generation (stub — implemented in Milestone 9) ─────── */

export async function generateContent(
  _request: AIGenerateRequest,
): Promise<AIGenerateResponse> {
  throw new Error(
    "AI provider not configured. Implement generateContent() in Milestone 9.",
  );
}

/* ─── Token estimation (used for credit cost preview) ──────── */

export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}
