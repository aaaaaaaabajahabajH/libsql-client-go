export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
}

export interface AIProvider {
  readonly name: string;
  stream(request: AIRequest): Promise<ReadableStream<string>>;
}
