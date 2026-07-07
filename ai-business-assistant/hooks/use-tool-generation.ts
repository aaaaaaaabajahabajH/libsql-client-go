"use client";

import * as React from "react";
import type { DbToolType } from "@/types/database";

export type GenerationStatus = "idle" | "generating" | "done" | "error";

interface GenerationState {
  status: GenerationStatus;
  output: string;
  error: string | null;
}

interface UseToolGenerationReturn extends GenerationState {
  generate: (input: Record<string, unknown>, title: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE: GenerationState = {
  status: "idle",
  output: "",
  error: null,
};

export function useToolGeneration(tool: DbToolType): UseToolGenerationReturn {
  const [state, setState] = React.useState<GenerationState>(INITIAL_STATE);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function generate(input: Record<string, unknown>, title: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: "generating", output: "", error: null });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, input, title }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const { error } = (await response.json()) as { error: string };
        setState({ status: "error", output: "", error: error ?? "Generation failed" });
        return;
      }

      if (!response.body) {
        setState({ status: "error", output: "", error: "No response body" });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setState((prev) => ({ ...prev, output: accumulated }));
      }

      setState({ status: "done", output: accumulated, error: null });
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Unexpected error";
      setState({ status: "error", output: "", error: message });
    }
  }

  function reset() {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }

  return { ...state, generate, reset };
}
