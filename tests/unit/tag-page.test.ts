import { parseTagPage, synonymNames } from "@src/common/tag-page";
import { TagType } from "@src/types/tags";
import { beforeEach, describe, expect, it } from "vitest";

const CANONICAL_PAGE = `
  <div class="tag home profile">
    <h2 class="heading">Hurt/Comfort</h2>
    <p>This tag belongs to the Additional Tags Category. It's a canonical tag. You can use it to filter works and to filter bookmarks.</p>
    <div class="synonym listbox group">
      <h3 class="heading">Tags with the same meaning:</h3>
      <ul class="tags commas index group">
        <li><a class="tag" href="/tags/HurtComfort">HurtComfort</a></li>
        <li><a class="tag" href="/tags/Hurt%20and%20Comfort">Hurt and Comfort</a></li>
      </ul>
    </div>
    <div class="parent listbox group">
      <ul class="tags commas index group">
        <li><a class="tag" href="/tags/No%20Fandom">No Fandom</a></li>
      </ul>
    </div>
    <div class="meta listbox group">
      <ul class="tags commas index group">
        <li><a class="tag" href="/tags/Comfort">Comfort</a></li>
      </ul>
    </div>
    <div class="sub listbox group">
      <ul class="tags commas index group">
        <li><a class="tag" href="/tags/Emotional%20Hurt*s*Comfort">Emotional Hurt/Comfort</a></li>
      </ul>
    </div>
  </div>`;

// Real AO3 markup: the synonym declaration lives in a separate Mergers
// module, not in the profile description paragraph.
const SYNONYM_PAGE = `
  <div class="tag home profile">
    <div class="primary header module">
      <h2 class="heading">Wank and Tell</h2>
      <ul class="navigation actions" role="navigation">
        <li><a href="/tags/Wank%20and%20Tell/works">Works</a></li>
      </ul>
    </div>
    <p>This tag belongs to the Additional Tags Category.
    </p>
    <div class="parent listbox group">
      <ul class="tags commas index group"><li><a class="tag" href="/tags/No%20Fandom">No Fandom</a></li></ul>
    </div>
    <div class="merger module">
      <h3 class="heading">Mergers</h3>
      <p>Wank and Tell has been made a synonym of <a class="tag" href="/tags/Wank%20and%20Tell%20%7C%20Creator%20is%20Open%20to%20Comments">Wank and Tell | Creator is Open to Comments</a>. Works and bookmarks tagged with Wank and Tell will show up in Wank and Tell | Creator is Open to Comments's filter.</p>
    </div>
  </div>`;

const LEGACY_SYNONYM_PAGE = `
  <div class="tag home profile">
    <h2 class="heading">HurtComfort</h2>
    <p>This tag belongs to the Additional Tags Category. It has been made a synonym of <a href="/tags/Hurt*s*Comfort">Hurt/Comfort</a>. Works and bookmarks tagged with HurtComfort will show up in Hurt/Comfort's filter.</p>
  </div>`;

const FANDOM_PAGE = `
  <div class="tag home profile">
    <h2 class="heading">The Locked Tomb Series | Tamsyn Muir</h2>
    <p>This tag belongs to the Fandom Category. It's a canonical tag. You can use it to filter works and to filter bookmarks.</p>
    <div class="parent fandom listbox group">
      <ul class="tags commas index group">
        <li><a class="tag" href="/tags/Books%20*a*%20Literature">Books &amp; Literature</a></li>
      </ul>
    </div>
    <div class="child listbox group">
      <div class="characters listbox group">
        <ul class="tags commas index group">
          <li><a class="tag" href="/tags/Gideon%20Nav">Gideon Nav</a></li>
        </ul>
      </div>
      <div class="relationships listbox group">
        <ul class="tags commas index group">
          <li><a class="tag" href="/tags/Gideon%20Nav*s*Harrowhark%20Nonagesimus">Gideon Nav/Harrowhark Nonagesimus</a></li>
        </ul>
      </div>
    </div>
  </div>`;

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("parseTagPage", () => {
  it("parses a canonical freeform tag with synonyms", () => {
    document.body.innerHTML = CANONICAL_PAGE;

    const parsed = parseTagPage(document);

    if (!parsed) throw new Error("expected the canonical page to parse");

    expect(parsed.name).toBe("Hurt/Comfort");
    expect(parsed.type).toBe(TagType.FREEFORM);
    expect(parsed.canonical).toBe(true);
    expect(parsed.synonymOf).toBeNull();
    expect(synonymNames(parsed)).toEqual(["HurtComfort", "Hurt and Comfort"]);
    expect(parsed.parents.map((t) => t.name)).toEqual(["No Fandom"]);
    expect(parsed.metas.map((t) => t.name)).toEqual(["Comfort"]);
    expect(parsed.children.map((t) => t.name)).toEqual([
      "Emotional Hurt/Comfort",
    ]);
  });

  it("parses a synonym page with the merger module (current AO3 markup)", () => {
    document.body.innerHTML = SYNONYM_PAGE;

    const parsed = parseTagPage(document);

    expect(parsed).not.toBeNull();
    expect(parsed?.name).toBe("Wank and Tell");
    expect(parsed?.type).toBe(TagType.FREEFORM);
    expect(parsed?.canonical).toBe(false);
    expect(parsed?.synonymOf).toEqual({
      name: "Wank and Tell | Creator is Open to Comments",
      url: "/tags/Wank%20and%20Tell%20%7C%20Creator%20is%20Open%20to%20Comments",
      type: TagType.FREEFORM,
    });
    expect(parsed?.synonyms).toEqual([]);
  });

  it("parses a synonym declared in the profile paragraph (legacy markup)", () => {
    document.body.innerHTML = LEGACY_SYNONYM_PAGE;

    const parsed = parseTagPage(document);

    expect(parsed?.name).toBe("HurtComfort");
    expect(parsed?.synonymOf).toEqual({
      name: "Hurt/Comfort",
      url: "/tags/Hurt*s*Comfort",
      type: TagType.FREEFORM,
    });
  });

  it("parses fandom pages with media parents and typed children", () => {
    document.body.innerHTML = FANDOM_PAGE;

    const parsed = parseTagPage(document);

    expect(parsed?.type).toBe(TagType.FANDOM);
    expect(parsed?.parents).toEqual([
      {
        name: "Books & Literature",
        url: "/tags/Books%20*a*%20Literature",
        type: TagType.MEDIA,
      },
    ]);
    expect(parsed?.children.map((t) => [t.name, t.type])).toEqual([
      ["Gideon Nav", TagType.CHARACTER],
      ["Gideon Nav/Harrowhark Nonagesimus", TagType.RELATIONSHIP],
    ]);
  });

  it("returns null for non-tag documents", () => {
    document.body.innerHTML = `<div id="main"><h2>Search results</h2></div>`;

    expect(parseTagPage(document)).toBeNull();
  });

  it("returns UNKNOWN type when the category is unrecognized", () => {
    document.body.innerHTML = `
      <div class="tag home profile">
        <h2 class="heading">Mystery Tag</h2>
      </div>`;

    const parsed = parseTagPage(document);

    expect(parsed?.type).toBe(TagType.UNKNOWN);
    expect(parsed?.canonical).toBe(false);
  });
});
