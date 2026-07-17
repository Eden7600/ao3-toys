import type { RegexTagResponse } from "@src/background/handlers/regex-tag-handler";
import type { TagFilterAction, TagFilterState } from "@src/common/ao3-filter";
import { Color } from "@src/common/color";
import type { CommonTag } from "@src/common/models/CommonTag";
import { TAG_HIGHLIGHT_COLORS } from "../tag-config";

export type TagPanelStatus = "idle" | "enriching" | "unavailable";

export type TagPanelFilter = {
  state: TagFilterState;
  onApply: (action: TagFilterAction) => void;
};

const FilterActions = ({
  filter,
  tagPagePath,
}: {
  filter: TagPanelFilter | null;
  tagPagePath: string | null;
}) => {
  if (!filter && !tagPagePath) {
    return null;
  }

  return (
    <div class="rt-tag-filter">
      {filter && (
        <div
          class="rt-tag-filter-actions"
          role="group"
          aria-label="AO3 search filter"
        >
          <button
            class={`rt-tag-filter-btn${filter.state === "included" ? " active" : ""}`}
            title={
              filter.state === "included"
                ? "Remove this tag from the include filter"
                : "Only show works with this tag"
            }
            onClick={() => {
              filter.onApply("include");
            }}
          >
            {filter.state === "included" ? "✓ Included" : "+ Include"}
          </button>
          <button
            class={`rt-tag-filter-btn${filter.state === "excluded" ? " active" : ""}`}
            title={
              filter.state === "excluded"
                ? "Remove this tag from the exclude filter"
                : "Hide works with this tag from these results"
            }
            onClick={() => {
              filter.onApply("exclude");
            }}
          >
            {filter.state === "excluded" ? "✓ Excluded" : "− Exclude"}
          </button>
        </div>
      )}
      {tagPagePath && (
        <a class="rt-tag-page-link" href={tagPagePath}>
          Tag page ↗
        </a>
      )}
    </div>
  );
};

const PanelHeader = ({
  tagName,
  row,
  regexMatch,
  status,
}: {
  tagName: string;
  row: CommonTag | null;
  regexMatch: RegexTagResponse | null;
  status: TagPanelStatus;
}) => {
  const aliasCount = row?.aliases?.length;

  return (
    <div class="rt-tag-head">
      <span class="rt-tag-name">{tagName}</span>
      {row && row.name !== tagName && (
        <span class="rt-tag-sub">canonical: {row.name}</span>
      )}
      {aliasCount !== undefined && aliasCount > 0 && (
        <span class="rt-tag-sub">
          covers {aliasCount} synonym{aliasCount === 1 ? "" : "s"}
        </span>
      )}
      {regexMatch && (
        <span class="rt-tag-sub">
          regex rule “{regexMatch.regexName}”{" "}
          {row ? "(overridden by this tag)" : "(styling this tag)"}
        </span>
      )}
      {status === "enriching" && (
        <span class="rt-tag-sub">fetching synonyms…</span>
      )}
      {status === "unavailable" && (
        <span class="rt-tag-sub">synonyms unavailable — will retry later</span>
      )}
    </div>
  );
};

/**
 * Presentational tag-highlight controls, shared by the floating popover and
 * the canonical tag page's inline mount.
 */
const TagControlsPanel = ({
  tagName,
  row,
  regexMatch = null,
  status = "idle",
  filter = null,
  tagPagePath = null,
  onSelectColor,
  onClear,
  onToggleHide,
}: {
  tagName: string;
  row: CommonTag | null;
  regexMatch?: RegexTagResponse | null;
  status?: TagPanelStatus;
  filter?: TagPanelFilter | null;
  tagPagePath?: string | null;
  onSelectColor: (color: string) => void;
  onClear: () => void;
  onToggleHide: (key: "hideWork" | "hideTag", value: boolean) => void;
}) => {
  const currentColor = row?.color ?? null;

  return (
    <div class="rt-tag-panel">
      <PanelHeader
        tagName={tagName}
        row={row}
        regexMatch={regexMatch}
        status={status}
      />
      <div class="rt-swatches" role="group" aria-label="Highlight color">
        {TAG_HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color}
            class={`rt-swatch${currentColor === color ? " selected" : ""}`}
            style={{
              backgroundImage: Color.getHighlightButtonGradient(color),
            }}
            title={`Highlight as ${color}`}
            aria-label={`Highlight as ${color}`}
            aria-pressed={currentColor === color}
            onClick={() => {
              onSelectColor(color);
            }}
          />
        ))}
        <button
          class={`rt-swatch rt-swatch-fade${currentColor === "fade" ? " selected" : ""}`}
          title="Fade tag"
          aria-label="Fade tag"
          aria-pressed={currentColor === "fade"}
          onClick={() => {
            onSelectColor("fade");
          }}
        />
      </div>
      <div class="rt-tag-toggles">
        <label class="rt-toggle">
          <input
            type="checkbox"
            class="rt-sr-only"
            checked={row?.hideWork ?? false}
            onChange={(event) => {
              onToggleHide(
                "hideWork",
                (event.target as HTMLInputElement).checked,
              );
            }}
          />
          <span class="rt-toggle-track" aria-hidden="true" />
          <span class="rt-toggle-label">Hide works</span>
        </label>
        <label class="rt-toggle">
          <input
            type="checkbox"
            class="rt-sr-only"
            checked={row?.hideTag ?? false}
            onChange={(event) => {
              onToggleHide(
                "hideTag",
                (event.target as HTMLInputElement).checked,
              );
            }}
          />
          <span class="rt-toggle-track" aria-hidden="true" />
          <span class="rt-toggle-label">Hide tag</span>
        </label>
        <button
          class="rt-tag-clear"
          disabled={!row}
          onClick={onClear}
          title="Remove this tag's highlight configuration"
        >
          Clear
        </button>
      </div>
      <FilterActions filter={filter} tagPagePath={tagPagePath} />
    </div>
  );
};

export default TagControlsPanel;
