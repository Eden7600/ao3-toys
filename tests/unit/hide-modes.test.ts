import {
  defaultHideModes,
  getHideSources,
  isWorkHideExempt,
  markWorkForHiding,
  markWorkHideExempt,
  resolveHideMode,
  restoreExemptWork,
} from "@src/common/hide-modes";
import { beforeEach, describe, expect, it } from "vitest";

describe("resolveHideMode", () => {
  it("collapses when a collapse-mode source contributes", () => {
    expect(
      resolveHideMode(["excluded-tags", "language"], defaultHideModes),
    ).toBe("collapse");
  });

  it("removes when any source is configured to remove", () => {
    expect(
      resolveHideMode(["excluded-tags", "ignored"], defaultHideModes),
    ).toBe("remove");
  });

  it("collapses legacy markers without sources", () => {
    expect(resolveHideMode([], defaultHideModes)).toBe("collapse");
  });

  it("resolves to none when every contributing source says don't hide", () => {
    expect(resolveHideMode(["visited", "subscribed"], defaultHideModes)).toBe(
      "none",
    );
    expect(resolveHideMode(["language"], defaultHideModes)).toBe("none");
  });

  it("defaults every reading-state source to don't hide", () => {
    expect(
      resolveHideMode(
        [
          "read-finished",
          "read-caught-up",
          "read-behind",
          "read-barely-started",
        ],
        defaultHideModes,
      ),
    ).toBe("none");
  });

  it("honors configured reading-state modes with severity merge", () => {
    const modes = {
      ...defaultHideModes,
      "read-behind": "collapse",
      "read-barely-started": "remove",
    } as const;

    expect(resolveHideMode(["read-behind"], modes)).toBe("collapse");
    expect(resolveHideMode(["read-behind", "read-barely-started"], modes)).toBe(
      "remove",
    );
  });

  it("lets a hiding source win over none-mode sources", () => {
    expect(
      resolveHideMode(["visited", "excluded-tags"], defaultHideModes),
    ).toBe("collapse");
    expect(
      resolveHideMode(["visited"], { ...defaultHideModes, visited: "remove" }),
    ).toBe("remove");
  });

  it("honors overridden modes", () => {
    expect(
      resolveHideMode(["language"], {
        ...defaultHideModes,
        language: "remove",
      }),
    ).toBe("remove");
    expect(
      resolveHideMode(["ignored"], {
        ...defaultHideModes,
        ignored: "collapse",
      }),
    ).toBe("collapse");
  });
});

describe("markWorkForHiding", () => {
  let work: HTMLElement;

  beforeEach(() => {
    work = document.createElement("li");
    work.className = "work blurb";
    document.body.replaceChildren(work);
  });

  it("marks the blurb with reason and source", () => {
    markWorkForHiding(work, "ignored", "Ignored on server");

    expect(work.dataset.toyboxHide).toBe("true");
    expect(JSON.parse(work.dataset.toyboxHideReason ?? "[]")).toEqual([
      "Ignored on server",
    ]);
    expect(getHideSources(work)).toEqual(["ignored"]);
  });

  it("accumulates distinct sources and reasons", () => {
    markWorkForHiding(work, "excluded-tags", "Contains excluded tag: Foo");
    markWorkForHiding(work, "language", "Language not allowed: Klingon");

    expect(JSON.parse(work.dataset.toyboxHideReason ?? "[]")).toEqual([
      "Contains excluded tag: Foo",
      "Language not allowed: Klingon",
    ]);
    expect(getHideSources(work)).toEqual(["excluded-tags", "language"]);
  });

  it("deduplicates repeated marks", () => {
    markWorkForHiding(work, "ignored", "Ignored on server");
    markWorkForHiding(work, "ignored", "Ignored on server");

    expect(JSON.parse(work.dataset.toyboxHideReason ?? "[]")).toEqual([
      "Ignored on server",
    ]);
    expect(getHideSources(work)).toEqual(["ignored"]);
  });

  it("recovers from corrupt marker data", () => {
    work.dataset.toyboxHideReason = "not json";
    markWorkForHiding(work, "fandom", "Too many fandoms");

    expect(JSON.parse(work.dataset.toyboxHideReason)).toEqual([
      "Too many fandoms",
    ]);
  });

  it("returns no sources for legacy markers", () => {
    work.dataset.toyboxHide = "true";

    expect(getHideSources(work)).toEqual([]);
  });
});

describe("hide exemption", () => {
  let work: HTMLElement;

  beforeEach(() => {
    work = document.createElement("li");
    work.className = "work blurb";
    document.body.replaceChildren(work);
  });

  it("marks and detects exemption", () => {
    expect(isWorkHideExempt(work)).toBe(false);

    markWorkHideExempt(work);

    expect(isWorkHideExempt(work)).toBe(true);
  });

  it("pins the processed marker without restoring when never hidden", () => {
    const restored = restoreExemptWork(work);

    expect(restored).toBe(false);
    expect(work.dataset.toyboxHideProcessed).toBe("exempt");
  });

  it("restores a hidden work and removes its placeholder", () => {
    const placeholder = document.createElement("div");
    placeholder.dataset.toyboxHideReason = "true";
    document.body.insertBefore(placeholder, work);

    work.dataset.toyboxHideProcessed = "true";
    work.style.display = "none";

    const restored = restoreExemptWork(work);

    expect(restored).toBe(true);
    expect(work.style.display).toBe("");
    expect(work.dataset.toyboxHideProcessed).toBe("exempt");
    expect(document.body.contains(placeholder)).toBe(false);
  });

  it("restores a removed work that has no placeholder", () => {
    work.dataset.toyboxHideProcessed = "true";
    work.style.display = "none";

    expect(restoreExemptWork(work)).toBe(true);
    expect(work.style.display).toBe("");
  });

  it("does not remove an unrelated preceding sibling", () => {
    const sibling = document.createElement("li");
    document.body.insertBefore(sibling, work);

    work.dataset.toyboxHideProcessed = "true";
    work.style.display = "none";
    restoreExemptWork(work);

    expect(document.body.contains(sibling)).toBe(true);
  });

  it("is idempotent — the second restore is a no-op", () => {
    work.dataset.toyboxHideProcessed = "true";
    work.style.display = "none";

    expect(restoreExemptWork(work)).toBe(true);
    expect(restoreExemptWork(work)).toBe(false);
    expect(work.dataset.toyboxHideProcessed).toBe("exempt");
  });
});
