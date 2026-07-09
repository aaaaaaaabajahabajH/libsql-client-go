type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

function formatEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(entry);
  }
  const ts = entry.timestamp.slice(11, 23);
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
  return `[${ts}] ${entry.level.toUpperCase().padEnd(5)} ${entry.message}${ctx}`;
}

function createEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  err?: unknown,
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };

  if (err instanceof Error) {
    entry.error = {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      code: "code" in err ? String((err as NodeJS.ErrnoException).code) : undefined,
    };
  }

  return entry;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatEntry(createEntry("debug", message, context)));
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatEntry(createEntry("info", message, context)));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatEntry(createEntry("warn", message, context)));
  },

  error(message: string, err?: unknown, context?: LogContext): void {
    console.error(formatEntry(createEntry("error", message, context, err)));
  },
};
