import { render } from "preact";
import { useState } from "preact/hooks";

import type { RegexTagResponse } from "@src/background/handlers/regex-tag-handler";
import type { CommonTag } from "@src/common/models/CommonTag";
import {
  parseTagPage,
  synonymNames,
  type ParsedTagPage,
} from "@src/common/tag-page";
import TagControlsPanel from "../components/tag-controls-panel";
import { ContentScript } from "../content-script";
import { createShadowHost } from "../shadow-host";
import rtBaseStyles from "../styles/rt-base.css?inline";
import tagControlsStyles from "../styles/tag-controls.css?inline";
import {
  clearTagConfig,
  loadTagConfig,
  namesForRow,
  restyleTags,
  saveTagConfig,
  type TagConfigPatch,
} from "../tag-config";

const TagPageControls = ({
  parsed,
  initialRow,
  regexMatch,
}: {
  parsed: ParsedTagPage;
  initialRow: CommonTag | null;
  regexMatch: RegexTagResponse | null;
}) => {
  const [row, setRow] = useState<CommonTag | null>(initialRow);
  const pageAliases = synonymNames(parsed);

  // On the tag's own page we never hide its links — restyle colors only.
  const restyle = (saved: CommonTag | null) => {
    if (saved) {
      restyleTags(
        namesForRow(saved, parsed.name),
        { color: saved.color, hideTag: false },
        false,
      );
    }
  };

  const applyPatch = (patch: TagConfigPatch) => {
    void saveTagConfig(row, parsed.name, patch, pageAliases).then((saved) => {
      setRow(saved);
      restyle(saved);
    });
  };

  const clearConfig = () => {
    if (!row) {
      return;
    }

    const clearedRow = row;
    // A matching regex rule takes back over once the common row is gone.
    const fallback = regexMatch
      ? { color: regexMatch.color, hideTag: false }
      : null;

    void clearTagConfig(clearedRow).then(() => {
      restyleTags(namesForRow(clearedRow, parsed.name), fallback, false);
      setRow(null);
    });
  };

  return (
    <div class="rt-tag-inline">
      <TagControlsPanel
        tagName={parsed.name}
        row={row}
        regexMatch={regexMatch}
        onSelectColor={(color) => {
          applyPatch({ color });
        }}
        onClear={clearConfig}
        onToggleHide={(key, value) => {
          applyPatch({ [key]: value });
        }}
      />
    </div>
  );
};

export default class CommonTagControls extends ContentScript {
  getEnabled(): boolean {
    const isTagPage =
      window.location.pathname.includes("/tags/") &&
      !window.location.pathname.includes("/works");

    if (!isTagPage) {
      return false;
    }

    const tagHomeProfile = document.querySelector("div.tag.home.profile>p");

    return tagHomeProfile?.textContent.includes("canonical tag") ?? false;
  }

  async onPostProcess(): Promise<void> {
    const parsed = parseTagPage(document);

    if (!parsed?.canonical) {
      this.logger.log("No canonical tag parsed, shutting down...");

      return;
    }

    const headerElement = document.querySelector(
      "div.primary.header>ul.navigation.actions",
    );

    if (!headerElement) {
      this.logger.log("Could not find header element, shutting down...");

      return;
    }

    const lookup = await loadTagConfig(parsed.name);

    const listItem = document.createElement("li");
    headerElement.append(listItem);

    const { root } = createShadowHost({
      css: `${rtBaseStyles}\n${tagControlsStyles}`,
      hostStyle: "display: inline-block; vertical-align: middle;",
      parent: listItem,
    });

    render(
      <TagPageControls
        parsed={parsed}
        initialRow={lookup.row}
        regexMatch={lookup.regex}
      />,
      root,
    );

    // Reflect an existing highlight on the page's synonym links right away
    if (lookup.row?.color) {
      restyleTags(
        namesForRow(lookup.row, parsed.name),
        { color: lookup.row.color, hideTag: false },
        false,
      );
    }
  }
}
