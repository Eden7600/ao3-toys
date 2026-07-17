import {
  hasConfiguredNames,
  mightContainPlaceholder,
  replacePlaceholders,
  type YnNames,
} from "@src/common/yn-replacer";
import { describe, expect, it } from "vitest";

const names: YnNames = { firstName: "Alex", lastName: "Reyes" };

describe("replacePlaceholders", () => {
  it("replaces first-name tokens in both cases", () => {
    expect(replacePlaceholders("Hey, Y/N!", names)).toBe("Hey, Alex!");
    expect(replacePlaceholders("(y/n) smiled", names)).toBe("(Alex) smiled");
    expect(replacePlaceholders("yn looked up", names)).toBe("Alex looked up");
    expect(replacePlaceholders("Miss F/N", names)).toBe("Miss Alex");
    expect(replacePlaceholders("dear Y/F/N", names)).toBe("dear Alex");
  });

  it("replaces last-name tokens", () => {
    expect(replacePlaceholders("Ms. L/N spoke", names)).toBe("Ms. Reyes spoke");
    expect(replacePlaceholders("Detective Y/L/N", names)).toBe(
      "Detective Reyes",
    );
  });

  it("never matches inside words or alphanumeric runs", () => {
    const text = "SYNC dynamic DYNAMO async YNAB A/YN YN2";

    expect(replacePlaceholders(text, names)).toBe(text);
  });

  it("handles adjacent punctuation and possessives", () => {
    expect(replacePlaceholders("[Y/N]'s coat", names)).toBe("[Alex]'s coat");
    expect(replacePlaceholders('"Y/N," she said', names)).toBe(
      '"Alex," she said',
    );
    expect(replacePlaceholders("Y/N's", names)).toBe("Alex's");
  });

  it("leaves tokens whose name is unconfigured", () => {
    const firstOnly: YnNames = { firstName: "Alex", lastName: "" };
    const lastOnly: YnNames = { firstName: "", lastName: "Reyes" };

    expect(replacePlaceholders("Y/N and L/N", firstOnly)).toBe("Alex and L/N");
    expect(replacePlaceholders("Y/N and L/N", lastOnly)).toBe("Y/N and Reyes");
  });

  it("is a no-op with no names configured", () => {
    const none: YnNames = { firstName: "", lastName: "  " };

    expect(replacePlaceholders("Y/N and L/N", none)).toBe("Y/N and L/N");
  });

  it("replaces every occurrence and handles empty text", () => {
    expect(replacePlaceholders("Y/N, Y/N, Y/N", names)).toBe(
      "Alex, Alex, Alex",
    );
    expect(replacePlaceholders("", names)).toBe("");
  });
});

describe("hasConfiguredNames", () => {
  it("requires at least one non-blank name", () => {
    expect(hasConfiguredNames(names)).toBe(true);
    expect(hasConfiguredNames({ firstName: "Alex", lastName: "" })).toBe(true);
    expect(hasConfiguredNames({ firstName: "", lastName: "Reyes" })).toBe(true);
    expect(hasConfiguredNames({ firstName: " ", lastName: "" })).toBe(false);
  });
});

describe("mightContainPlaceholder", () => {
  it("is true for candidate text and false for plain prose", () => {
    expect(mightContainPlaceholder("hello Y/N")).toBe(true);
    expect(mightContainPlaceholder("dynamite")).toBe(true); // Pre-test only
    expect(mightContainPlaceholder("plain prose here")).toBe(false);
  });
});
