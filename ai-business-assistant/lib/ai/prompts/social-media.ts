import type { BuiltPrompt } from "./types";

const PLATFORM_RULES: Record<string, string> = {
  twitter: "Max 280 characters. Punchy, direct, conversational. Use line breaks for readability. Start with a hook. End with a question or CTA when appropriate.",
  linkedin: "Professional networking tone. 150-300 words ideal. Start with a bold statement or insight. Use short paragraphs and line breaks. Include a genuine takeaway. End with a discussion question.",
  instagram: "Lifestyle-forward, aspirational yet relatable. 100-200 word caption. Put the most important content in the first line (before the 'more' cutoff). Use 5-10 relevant hashtags at the end.",
  facebook: "Conversational, community-focused. 40-80 words performs best. Ask a question to drive comments. Friendly and personal tone.",
};

interface Input {
  platform: string;
  topic: string;
  tone: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
}

export function buildSocialMediaPrompt(input: Input): BuiltPrompt {
  const platformRule = PLATFORM_RULES[input.platform] ?? "";

  const systemPrompt = `You are an expert social media copywriter specializing in ${input.platform} content. ${platformRule} Write in a ${input.tone} tone. ${input.includeEmojis ? "Use relevant emojis sparingly and strategically." : "Do NOT use emojis."} ${input.includeHashtags && input.platform !== "twitter" ? "Include relevant hashtags." : ""} Output ONLY the finished post — no labels, no explanations, no alternatives.`;

  const userPrompt = `Create a ${input.platform} post about: ${input.topic}

Tone: ${input.tone}
Platform: ${input.platform}

Write the complete, ready-to-publish post.`;

  return {
    systemPrompt,
    userPrompt,
    maxTokens: input.platform === "twitter" ? 200 : 600,
    temperature: 0.8,
  };
}
