import { cleanTagUrl, stripBaseUrl } from "@src/common/clean-urls";
import { describe, expect, it } from "vitest";

describe("stripBaseUrl", () => {
  it("removes the protocol and ao3 domain", () => {
    expect(stripBaseUrl("https://archiveofourown.org/tags/Fluff")).toBe(
      "/tags/Fluff",
    );
  });

  it("removes the mirror domain", () => {
    expect(
      stripBaseUrl("https://archive.transformativeworks.org/tags/Fluff"),
    ).toBe("/tags/Fluff");
  });

  it("handles plain http", () => {
    expect(stripBaseUrl("http://archiveofourown.org/tags/Fluff")).toBe(
      "/tags/Fluff",
    );
  });

  it("leaves relative urls untouched", () => {
    expect(stripBaseUrl("/tags/Fluff")).toBe("/tags/Fluff");
  });

  it("removes the vanity domains", () => {
    expect(stripBaseUrl("https://archiveofourown.com/tags/Fluff")).toBe(
      "/tags/Fluff",
    );
    expect(stripBaseUrl("https://archiveofourown.net/tags/Fluff")).toBe(
      "/tags/Fluff",
    );
    expect(stripBaseUrl("https://ao3.org/tags/Fluff")).toBe("/tags/Fluff");
  });

  it("removes subdomain-qualified AO3 hosts", () => {
    expect(stripBaseUrl("https://www.archiveofourown.org/tags/Fluff")).toBe(
      "/tags/Fluff",
    );
  });

  it("only removes the protocol from non-AO3 hosts", () => {
    expect(stripBaseUrl("https://example.com/tags/Fluff")).toBe(
      "example.com/tags/Fluff",
    );
  });
});

describe("cleanTagUrl", () => {
  it("strips the domain and the works suffix", () => {
    expect(
      cleanTagUrl(
        "https://archiveofourown.org/tags/Enemies%20to%20Lovers/works",
      ),
    ).toBe("/tags/Enemies%20to%20Lovers");
  });

  it("keeps tag urls without a works suffix intact", () => {
    expect(cleanTagUrl("https://archiveofourown.org/tags/Fluff")).toBe(
      "/tags/Fluff",
    );
  });
});
