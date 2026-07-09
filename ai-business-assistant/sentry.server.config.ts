import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  debug: false,

  beforeSend(event, hint) {
    const err = hint.originalException;
    if (
      err instanceof Error &&
      (err.message.includes("ECONNREFUSED") || err.message.includes("ENOTFOUND"))
    ) {
      return null;
    }
    return event;
  },
});
