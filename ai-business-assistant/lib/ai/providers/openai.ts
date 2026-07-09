import type { AIProvider, AIRequest } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";
const STREAM_TIMEOUT_MS = 55_000; // 55 s — leaves buffer before maxDuration=60

interface OpenAIChunk {
  choices: Array<{
    delta: { content?: string };
    finish_reason: string | null;
  }>;
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  async stream(request: AIRequest): Promise<ReadableStream<string>> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const model = process.env.OPENAI_MODEL ?? DEFAULT_MODEL;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          stream: true,
          max_tokens: request.maxTokens,
          temperature: request.temperature,
          messages: [
            { role: "system", content: request.systemPrompt },
            { role: "user", content: request.userPrompt },
          ],
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${body}`);
    }

    if (!response.body) throw new Error("OpenAI returned empty response body");

    const decoder = new TextDecoder();

    return new ReadableStream<string>({
      async start(ctrl) {
        const reader = response.body!.getReader();
        let buffer = "";

        // Per-chunk read timeout — prevents indefinite hangs mid-stream.
        let chunkTimer: ReturnType<typeof setTimeout> | undefined;
        const resetChunkTimer = () => {
          clearTimeout(chunkTimer);
          chunkTimer = setTimeout(() => reader.cancel(), STREAM_TIMEOUT_MS);
        };

        try {
          resetChunkTimer();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            resetChunkTimer();

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                ctrl.close();
                return;
              }
              try {
                const chunk = JSON.parse(data) as OpenAIChunk;
                const text = chunk.choices[0]?.delta?.content;
                if (text) ctrl.enqueue(text);
              } catch {
                // Skip malformed SSE chunks
              }
            }
          }
          ctrl.close();
        } catch (err) {
          ctrl.error(err);
        } finally {
          clearTimeout(chunkTimer);
          reader.releaseLock();
        }
      },
    });
  }
}
