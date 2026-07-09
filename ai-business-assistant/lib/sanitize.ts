const HTML_ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE[char] ?? char);
}

export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

export function sanitizeText(input: string, maxLength?: number): string {
  let text = stripHtml(input);
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  if (maxLength !== undefined) {
    text = text.slice(0, maxLength);
  }
  return text.trim();
}

const SAFE_URL_PROTOCOLS = ["https:", "http:", "mailto:"];

export function sanitizeUrl(input: string): string {
  try {
    const url = new URL(input);
    if (!SAFE_URL_PROTOCOLS.includes(url.protocol)) {
      return "";
    }
    return url.toString();
  } catch {
    return "";
  }
}

export function sanitizeSearchQuery(input: string): string {
  return sanitizeText(input, 200)
    .replace(/[%_\\]/g, "\\$&")
    .replace(/\s+/g, " ");
}

export function sanitizeFilename(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 255);
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input) && input.length <= 254;
}

export function isValidUuid(input: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input);
}
