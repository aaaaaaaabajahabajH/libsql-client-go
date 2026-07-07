import type { AIProvider, AIRequest } from "./types";

const DEFAULT_MODEL = "gemini-1.5-flash";
const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> };
  finishReason?: string;
}

interface GeminiChunk {
  candidates?: GeminiCandidate[];
  error?: { message: string };
}

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  async stream(request: AIRequest): Promise<ReadableStream<string>> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_API_KEY is not configured");

    const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
    const url = `${API_BASE}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: request.systemPrompt }] },
        generationConfig: {
          maxOutputTokens: request.maxTokens,
          temperature: request.temperature,
        },
        contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${body}`);
    }

    if (!response.body) throw new Error("Gemini returned empty response body");

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
                const chunk = JSON.parse(data) as GeminiChunk;
                if (chunk.error) {
                  controller.error(new Error(chunk.error.message));
                  return;
                }
                const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) controller.enqueue(text);
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
