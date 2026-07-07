import type { AIProvider } from "./types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";

export function getProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  switch (name) {
    case "anthropic":
      return new AnthropicProvider();
    case "gemini":
      return new GeminiProvider();
    default:
      return new OpenAIProvider();
  }
}
