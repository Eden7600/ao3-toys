import { normalizeServerUrl } from "@src/common/server-url";
import { describe, expect, it } from "vitest";

describe("normalizeServerUrl", () => {
  it("returns null for the empty default", () => {
    expect(normalizeServerUrl("")).toBeNull();
    expect(normalizeServerUrl("   ")).toBeNull();
  });

  it("accepts http(s) URLs", () => {
    expect(normalizeServerUrl("https://example.com")).toBe(
      "https://example.com",
    );
    expect(normalizeServerUrl("http://localhost:8000")).toBe(
      "http://localhost:8000",
    );
  });

  it("strips whitespace and trailing slashes", () => {
    expect(normalizeServerUrl("  https://example.com/  ")).toBe(
      "https://example.com",
    );
    expect(normalizeServerUrl("https://example.com//")).toBe(
      "https://example.com",
    );
  });

  it("keeps a path prefix", () => {
    expect(normalizeServerUrl("https://example.com/sync/")).toBe(
      "https://example.com/sync",
    );
  });

  it("rejects non-http(s) schemes and non-URLs", () => {
    expect(normalizeServerUrl("ftp://example.com")).toBeNull();
    // eslint-disable-next-line no-script-url -- exactly the input being rejected
    expect(normalizeServerUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeServerUrl("example.com")).toBeNull();
    expect(normalizeServerUrl("not a url")).toBeNull();
  });
});
