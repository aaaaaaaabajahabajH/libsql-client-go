"use client";

import { useCallback, useState } from "react";

interface UseClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<void>;
  reset: () => void;
}

/**
 * Copies text to the clipboard and exposes a transient `copied` state
 * that automatically resets after `resetDelay` ms.
 *
 * @example
 * const { copied, copy } = useClipboard();
 * <button onClick={() => copy(output)}>{copied ? "Copied!" : "Copy"}</button>
 */
export function useClipboard(resetDelay: number = 2_000): UseClipboardReturn {
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setCopied(false);
  }, []);

  const copy = useCallback(
    async (text: string) => {
      if (!navigator.clipboard) {
        // Fallback for older browsers
        const el = document.createElement("textarea");
        el.value = text;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      } else {
        await navigator.clipboard.writeText(text);
      }

      setCopied(true);
      const timer = setTimeout(reset, resetDelay);
      return () => clearTimeout(timer);
    },
    [reset, resetDelay],
  );

  return { copied, copy, reset };
}
