"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

interface PostHogProviderProps {
  children: React.ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  useEffect(() => {
    if (!apiKey) return;
    posthog.init(apiKey, {
      api_host: host,
      capture_pageview: false, // handled manually via PageTracker
      capture_pageleave: true,
      persistence: "localStorage",
      autocapture: false,
    });
  }, [apiKey, host]);

  if (!apiKey) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
