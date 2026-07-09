import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  stripHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeSearchQuery,
  sanitizeFilename,
  isValidEmail,
  isValidUuid,
} from "@/lib/sanitize";

describe("escapeHtml", () => {
  it("escapes special HTML characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("removes self-closing tags", () => {
    expect(stripHtml("Line 1<br/>Line 2")).toBe("Line 1Line 2");
  });

  it("preserves plain text", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
});

describe("sanitizeText", () => {
  it("strips HTML and trims", () => {
    expect(sanitizeText("  <b>hello</b>  ")).toBe("hello");
  });

  it("truncates to maxLength", () => {
    expect(sanitizeText("hello world", 5)).toBe("hello");
  });

  it("removes control characters", () => {
    const withControl = "hello\x00world\x1F";
    expect(sanitizeText(withControl)).toBe("helloworld");
  });
});

describe("sanitizeUrl", () => {
  it("allows https URLs", () => {
    expect(sanitizeUrl("https://example.com/path")).toBe("https://example.com/path");
  });

  it("allows http URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
  });

  it("blocks javascript: protocol", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("blocks data: URIs", () => {
    expect(sanitizeUrl("data:text/html,<h1>xss</h1>")).toBe("");
  });

  it("returns empty for invalid URLs", () => {
    expect(sanitizeUrl("not-a-url")).toBe("");
  });
});

describe("sanitizeSearchQuery", () => {
  it("removes SQL wildcard characters", () => {
    const result = sanitizeSearchQuery("user%name_test");
    expect(result).toContain("\\%");
    expect(result).toContain("\\_");
  });

  it("collapses multiple spaces", () => {
    expect(sanitizeSearchQuery("hello   world")).toBe("hello world");
  });

  it("truncates to 200 characters", () => {
    const long = "a".repeat(300);
    expect(sanitizeSearchQuery(long).length).toBeLessThanOrEqual(200);
  });
});

describe("sanitizeFilename", () => {
  it("replaces special characters with underscores", () => {
    expect(sanitizeFilename("my file/name.txt")).toBe("my_file_name.txt");
  });

  it("collapses multiple underscores", () => {
    expect(sanitizeFilename("file___name.txt")).toBe("file_name.txt");
  });

  it("preserves alphanumeric, dots, dashes", () => {
    expect(sanitizeFilename("file-name.v2.txt")).toBe("file-name.v2.txt");
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user+tag@sub.domain.org")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
  });

  it("rejects emails over 254 characters", () => {
    const long = "a".repeat(250) + "@b.co";
    expect(isValidEmail(long)).toBe(false);
  });
});

describe("isValidUuid", () => {
  it("accepts valid UUIDs", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUuid("00000000-0000-0000-0000-000000000000")).toBe(true);
  });

  it("rejects invalid UUIDs", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("550e8400e29b41d4a716446655440000")).toBe(false);
    expect(isValidUuid("")).toBe(false);
  });
});
