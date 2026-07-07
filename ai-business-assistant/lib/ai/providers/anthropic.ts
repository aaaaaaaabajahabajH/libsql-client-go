import type { AIProvider, AIRequest } from "./types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const API_URL = "https://api.anthropic.com/v1/messages";

interface AnthropicStreamEvent {
  type: string;
  delta?: { type: string; text?: string };
  error?: { message: string };
}

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  async stream(request: AIRequest): Promise<ReadableStream<string>> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        stream: true,
        max_tokens: request.maxTokens,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userPrompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${body}`);
    }

    if (!response.body) throw new Error("Anthropic returned empty response body");

    const decoder = new TextDecoder();

    return new ReadableStream<string>({
      async start(controller) {
        const reader = response.body!.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              try {
                const event = JSON.parse(data) as AnthropicStreamEvent;
                if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
                  const text = event.delta.text;
                  if (text) controller.enqueue(text);
                } else if (event.type === "message_stop") {
                  controller.close();
                  return;
                } else if (event.type === "error") {
                  controller.error(new Error(event.error?.message ?? "Anthropic stream error"));
                  return;
                }
              } catch {
                // Skip malformed SSE chunks
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }
}
