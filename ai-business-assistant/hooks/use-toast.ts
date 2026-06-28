"use client";

/**
 * Minimal toast state manager — a simplified port of the shadcn/ui toast hook.
 * Intentionally self-contained: no external state library required.
 */

import { useEffect, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────── */

export type ToastVariant = "default" | "destructive" | "success";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type ToastInput = Omit<Toast, "id">;

/* ─── Module-level state (singleton per tab) ─────────────────── */

const TOAST_LIMIT = 3;
const DEFAULT_DURATION = 5_000;

let toasts: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function dispatch(updated: Toast[]) {
  toasts = updated;
  listeners.forEach((l) => l(updated));
}

/* ─── Public API ─────────────────────────────────────────────── */

export function toast(input: ToastInput): string {
  const id = crypto.randomUUID();
  const duration = input.duration ?? DEFAULT_DURATION;

  const newToast: Toast = { ...input, id, duration };

  dispatch([newToast, ...toasts].slice(0, TOAST_LIMIT));

  setTimeout(() => {
    dispatch(toasts.filter((t) => t.id !== id));
  }, duration);

  return id;
}

export function dismissToast(id: string) {
  dispatch(toasts.filter((t) => t.id !== id));
}

/* ─── Hook ───────────────────────────────────────────────────── */

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return {
    toasts: state,
    toast,
    dismiss: dismissToast,
  };
}
