import type { AIRequest } from "@/lib/ai/providers/types";

export type BuiltPrompt = Pick<AIRequest, "systemPrompt" | "userPrompt" | "maxTokens" | "temperature">;

export type PromptBuilder<T extends Record<string, unknown>> = (input: T) => BuiltPrompt;
