import type { BuiltPrompt } from "./types";

interface Input {
  productName: string;
  keyFeatures: string;
  targetAudience: string;
  tone: string;
}

export function buildProductDescriptionPrompt(input: Input): BuiltPrompt {
  const systemPrompt = `You are a conversion-focused e-commerce copywriter. Your descriptions transform browsers into buyers by:
- Leading with the strongest benefit, not a feature
- Painting a vivid picture of life improved by the product
- Using sensory and emotional language
- Addressing the target audience's specific pain points
- Building desire before mentioning price or specs
- Writing in a ${input.tone} tone

Format: Short compelling headline (1 line) → Hook sentence → 3-4 benefit-focused paragraphs → Closing CTA sentence.
Output ONLY the product description — no preamble, no meta-commentary.`;

  const userPrompt = `Write a compelling product description for:

Product: ${input.productName}
Key Features / Specs: ${input.keyFeatures}
Target Audience: ${input.targetAudience}
Tone: ${input.tone}

Make it persuasive, specific, and ready to publish.`;

  return { systemPrompt, userPrompt, maxTokens: 800, temperature: 0.7 };
}
