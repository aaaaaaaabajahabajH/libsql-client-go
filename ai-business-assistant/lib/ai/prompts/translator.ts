import type { BuiltPrompt } from "./types";

interface Input {
  text: string;
  targetLanguage: string;
  preserveTone: boolean;
  formality: string;
}

export function buildTranslatorPrompt(input: Input): BuiltPrompt {
  const formalityGuide =
    input.formality === "auto"
      ? "Match the formality level of the source text."
      : `Use a ${input.formality} register.`;

  const systemPrompt = `You are a professional translator with deep cultural and linguistic expertise.
Translation principles:
- Produce natural, idiomatic text — not word-for-word literal translation
- ${formalityGuide}
- ${input.preserveTone ? "Preserve the original emotional tone, voice, and personality exactly." : "Adapt the tone to be natural in the target language."}
- Maintain paragraph structure and formatting from the source
- For technical terms with no direct equivalent, use the most widely understood term and add the original in parentheses if needed
- Never add explanations, footnotes, or translator notes unless the source is genuinely ambiguous

Output ONLY the translated text — nothing else. No "Here is the translation:", no quotation marks around the output.`;

  const estimatedTokens = Math.max(300, Math.ceil(input.text.length / 2.5));

  const userPrompt = `Translate the following text to ${input.targetLanguage}:

${input.text}`;

  return {
    systemPrompt,
    userPrompt,
    maxTokens: Math.min(estimatedTokens, 3000),
    temperature: 0.3,
  };
}
