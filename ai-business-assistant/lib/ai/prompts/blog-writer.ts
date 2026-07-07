import type { BuiltPrompt } from "./types";

const WORD_COUNT_TOKENS: Record<string, number> = {
  "500": 800,
  "800": 1200,
  "1200": 1800,
  "2000": 2800,
};

interface Input {
  title: string;
  outline: string;
  tone: string;
  wordCount: string;
  includeHeadings: boolean;
}

export function buildBlogWriterPrompt(input: Input): BuiltPrompt {
  const systemPrompt = `You are an experienced SEO content writer. Write in ${input.tone} tone.
${input.includeHeadings ? "Structure with clear H2 and H3 markdown headings (## and ###)." : "Write in flowing prose without headings."}
- Write an engaging introduction that hooks the reader in the first 2 sentences
- Cover the outline points thoroughly with actionable insights
- Use short paragraphs (2-4 sentences max) for readability
- Include a compelling conclusion with a clear takeaway
- Target approximately ${input.wordCount} words
- Write for a general business audience — clear, jargon-free, practical
Output ONLY the blog post content, starting directly with the introduction. Do not output the title as a heading.`;

  const userPrompt = `Write a blog post with this title: "${input.title}"

Outline / key points to cover:
${input.outline}

Tone: ${input.tone}
Target word count: ~${input.wordCount} words`;

  return {
    systemPrompt,
    userPrompt,
    maxTokens: WORD_COUNT_TOKENS[input.wordCount] ?? 1800,
    temperature: 0.7,
  };
}
