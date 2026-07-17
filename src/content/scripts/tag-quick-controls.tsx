import { render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";

import type { RegexTagResponse } from "@src/background/handlers/regex-tag-handler";
import {
  applyTagFilter,
  isFilterableWorksListing,
  tagFilterState,
  type TagFilterAction,
} from "@src/common/ao3-filter";
import { cleanTagUrl } from "@src/common/clean-urls";
import type { CommonTag } from "@src/common/models/CommonTag";
import TagControlsPanel, {
  type TagPanelStatus,
} from "../components/tag-controls-panel";
import { ContentScript } from "../content-script";
import { createShadowHost } from "../shadow-host";
import rtBaseStyles from "../styles/rt-base.css?inline";
import tagControlsStyles from "../styles/tag-controls.css?inline";
import {
  clearTagConfig,
  enrichSavedTag,
  loadTagConfig,
  namesForRow,
  restyleTags,
  saveTagConfig,
  type TagConfigPatch,
} from "../tag-config";

const BADGE_SHOW_DELAY_MS = 150;
// Long enough for the pointer to travel tag → badge without the badge
// vanishing underneath it.
const BADGE_HIDE_GRACE_MS = 300;
const SCROLL_CLOSE_THRESHOLD_PX = 40;
const POPOVER_WIDTH_PX = 284;
const POPOVER_EST_HEIGHT_PX = 230;

type BadgeState = { anchor: HTMLAnchorElement; rect: DOMRect };
type PopoverState = {
  anchor: HTMLAnchorElement;
  rect: DOMRect;
  tagName: string;
  tagPath: string;
};

function popoverPosition(rect: DOMRect): {
  top: string;
  left: string;
  transform?: string;
} {
  const left = Math.min(
    Math.max(rect.left, 8),
    Math.max(8, window.innerWidth - POPOVER_WIDTH_PX - 8),
  );
  const openBelow =
    rect.bottom + POPOVER_EST_HEIGHT_PX + 12 <= window.innerHeight;

  if (openBelow) {
    return { top: `${String(rect.bottom + 6)}px`, left: `${String(left)}px` };
  }

  return {
    top: `${String(rect.top - 6)}px`,
    left: `${String(left)}px`,
    transform: "translateY(-100%)",
  };
}

const TagQuickControls = ({
  host,
  allowHideTag,
}: {
  host: HTMLElement;
  allowHideTag: boolean;
}) => {
  const [badge, setBadge] = useState<BadgeState | null>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [row, setRow] = useState<CommonTag | null>(null);
  const [regex, setRegex] = useState<RegexTagResponse | null>(null);
  const [status, setStatus] = useState<TagPanelStatus>("idle");

  const hoverTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  // Incremented per popover open; async work checks it before touching state.
  const sessionId = useRef(0);
  const scrollOrigin = useRef(0);

  const cancelBadgeHide = () => {
    if (hideTimer.current !== null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const scheduleBadgeHide = () => {
    cancelBadgeHide();
    hideTimer.current = window.setTimeout(() => {
      hideTimer.current = null;
      setBadge(null);
    }, BADGE_HIDE_GRACE_MS);
  };

  const openPopover = (anchor: HTMLAnchorElement) => {
    const tagName = anchor.textContent.trim();
    const tagPath = cleanTagUrl(anchor.getAttribute("href") ?? "");

    if (!tagName || !tagPath) {
      return;
    }

    sessionId.current += 1;
    const session = sessionId.current;

    setBadge(null);
    setRow(null);
    setRegex(null);
    setStatus("idle");
    setPopover({
      anchor,
      rect: anchor.getBoundingClientRect(),
      tagName,
      tagPath,
    });

    void loadTagConfig(tagName).then((lookup) => {
      if (sessionId.current === session) {
        setRow(lookup.row);
        setRegex(lookup.regex);
      }
    });
  };

  const openPopoverRef = useRef(openPopover);
  openPopoverRef.current = openPopover;

  const closePopover = (refocus: boolean) => {
    sessionId.current += 1;
    setPopover((current) => {
      if (refocus) {
        current?.anchor.focus();
      }

      return null;
    });
  };

  // Delegated hover + context-menu triggers (mounted once)
  useEffect(() => {
    const clearHoverTimer = () => {
      if (hoverTimer.current !== null) {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
    };

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const tag = target?.closest("a.tag");

      if (!(tag instanceof HTMLAnchorElement)) {
        return;
      }

      cancelBadgeHide();
      clearHoverTimer();
      hoverTimer.current = window.setTimeout(() => {
        setBadge({ anchor: tag, rect: tag.getBoundingClientRect() });
      }, BADGE_SHOW_DELAY_MS);
    };

    const onMouseOut = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;

      if (!target?.closest("a.tag")) {
        return;
      }

      clearHoverTimer();

      // Moving from the tag onto the badge retargets to our host — keep it.
      if (event.relatedTarget === host) {
        return;
      }

      // Grace period so the pointer can travel to the badge; entering the
      // badge cancels this.
      scheduleBadgeHide();
    };

    const onContextMenu = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const tag = target?.closest("a.tag");

      if (!(tag instanceof HTMLAnchorElement)) {
        return;
      }

      event.preventDefault();
      openPopoverRef.current(tag);
    };

    const onScrollHideBadge = () => {
      cancelBadgeHide();
      setBadge(null);
    };

    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("scroll", onScrollHideBadge, { passive: true });

    return () => {
      clearHoverTimer();
      cancelBadgeHide();
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("scroll", onScrollHideBadge);
    };
  }, [host]);

  // Popover dismissal (while open)
  useEffect(() => {
    if (!popover) {
      return;
    }

    scrollOrigin.current = window.scrollY;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopover(true);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.composedPath().includes(host)) {
        closePopover(false);
      }
    };

    const onScroll = () => {
      if (
        Math.abs(window.scrollY - scrollOrigin.current) >
        SCROLL_CLOSE_THRESHOLD_PX
      ) {
        closePopover(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [popover, host]);

  const applyPatch = (patch: TagConfigPatch) => {
    if (!popover) {
      return;
    }

    const { tagName, tagPath } = popover;
    const session = sessionId.current;

    void (async () => {
      const saved = await saveTagConfig(row, tagName, patch);

      if (sessionId.current === session) {
        setRow(saved);
      }

      restyleTags(
        namesForRow(saved, tagName),
        { color: saved.color, hideTag: saved.hideTag },
        allowHideTag,
      );

      if (saved.aliases !== undefined) {
        return;
      }

      if (sessionId.current === session) {
        setStatus("enriching");
      }

      const finalRow = await enrichSavedTag(saved, tagPath);

      if (finalRow) {
        restyleTags(
          namesForRow(finalRow, tagName),
          { color: finalRow.color, hideTag: finalRow.hideTag },
          allowHideTag,
        );
      }

      if (sessionId.current === session) {
        setRow(finalRow ?? saved);
        setStatus(finalRow ? "idle" : "unavailable");
      }
    })();
  };

  const clearConfig = () => {
    if (!popover || !row) {
      return;
    }

    const { tagName } = popover;
    const clearedRow = row;
    const session = sessionId.current;

    // A matching regex rule takes back over once the common row is gone.
    const fallback = regex
      ? { color: regex.color, hideTag: regex.hideTag }
      : null;

    void (async () => {
      await clearTagConfig(clearedRow);
      restyleTags(namesForRow(clearedRow, tagName), fallback, allowHideTag);

      if (sessionId.current === session) {
        setRow(null);
        setStatus("idle");
      }
    })();
  };

  return (
    <>
      {badge && !popover && (
        <button
          class="rt-tag-badge"
          style={{
            top: `${String(badge.rect.top + badge.rect.height / 2)}px`,
            // Flush against the tag so there is no dead gap to cross
            left: `${String(badge.rect.right)}px`,
          }}
          aria-label={`Tag options for ${badge.anchor.textContent}`}
          title="Tag highlight options"
          onMouseEnter={cancelBadgeHide}
          onMouseLeave={scheduleBadgeHide}
          onClick={() => {
            openPopover(badge.anchor);
          }}
        />
      )}
      {popover && (
        <div
          class="rt-tag-popover"
          role="dialog"
          aria-label={`Tag options for ${popover.tagName}`}
          style={popoverPosition(popover.rect)}
        >
          <TagControlsPanel
            tagName={popover.tagName}
            row={row}
            regexMatch={regex}
            status={status}
            filter={
              isFilterableWorksListing(new URL(window.location.href))
                ? {
                    state: tagFilterState(
                      new URL(window.location.href),
                      popover.tagName,
                    ),
                    onApply(action: TagFilterAction) {
                      window.location.assign(
                        applyTagFilter(
                          new URL(window.location.href),
                          popover.tagName,
                          action,
                        ).href,
                      );
                    },
                  }
                : null
            }
            tagPagePath={popover.tagPath}
            onSelectColor={(color) => {
              applyPatch({ color });
            }}
            onClear={clearConfig}
            onToggleHide={(key, value) => {
              applyPatch({ [key]: value });
            }}
          />
        </div>
      )}
    </>
  );
};

export default class TagQuickControlsScript extends ContentScript {
  getEnabled(): boolean {
    if (!this.settings.enableTagHighlighter) {
      return false;
    }

    return document.querySelector("a.tag") !== null;
  }

  async onProcess(): Promise<void> {
    const { host, root } = createShadowHost({
      css: `${rtBaseStyles}\n${tagControlsStyles}`,
      hostStyle:
        "position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483646;",
    });

    render(
      <TagQuickControls host={host} allowHideTag={this.settings.hideWorks} />,
      root,
    );
  }
}
