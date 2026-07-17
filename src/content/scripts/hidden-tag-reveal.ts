import { ContentScript } from "../content-script";

const CHIP_CLASS = "toybox-hidden-tags-chip";
const HIDDEN_TAG_SELECTOR = 'a.tag[data-toybox-hide-tag="true"]';

/**
 * Appends a "+x hidden tags" chip to blurb tag lists so hidden tags can
 * be revealed in place. Watches data-toybox-hide-tag itself because tags
 * are hidden both at page load (tag-highlighter) and live from the tag
 * manager popover (restyleTags), and the chip must track both.
 */
export default class HiddenTagReveal extends ContentScript {
  private static get WORK_SELECTOR(): string {
    return "li.work.blurb.group";
  }

  private observer: MutationObserver | null = null;
  private recomputeQueued = false;

  getEnabled(): boolean {
    return this.settings.showHiddenTagsChip;
  }

  async onProcess(): Promise<void> {
    this.recomputeAll();

    this.observer = new MutationObserver((mutations) => {
      // Only marker changes matter; reveal clicks touch style, not the
      // marker, so they never re-enter here.
      if (mutations.some((m) => m.attributeName === "data-toybox-hide-tag")) {
        this.queueRecompute();
      }
    });
    this.observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-toybox-hide-tag"],
    });
  }

  /** Batch bursts of marker changes (a popover save restyles many tags). */
  private queueRecompute(): void {
    if (this.recomputeQueued) {
      return;
    }

    this.recomputeQueued = true;
    requestAnimationFrame(() => {
      this.recomputeQueued = false;
      this.recomputeAll();
    });
  }

  private recomputeAll(): void {
    const works = document.querySelectorAll<HTMLElement>(
      HiddenTagReveal.WORK_SELECTOR,
    );

    works.forEach((work) => {
      this.updateChip(work);
    });
  }

  private updateChip(work: HTMLElement): void {
    const tagList = work.querySelector("ul.tags.commas");

    if (!tagList) {
      return;
    }

    const hiddenTags = work.querySelectorAll<HTMLElement>(HIDDEN_TAG_SELECTOR);
    const existing = tagList.querySelector<HTMLLIElement>(`li.${CHIP_CLASS}`);

    if (hiddenTags.length === 0) {
      existing?.remove();
      delete work.dataset.toyboxTagsRevealed;

      return;
    }

    // A marker change invalidates an in-progress reveal: reset to the
    // hidden state with a fresh count so the chip never lies.
    delete work.dataset.toyboxTagsRevealed;
    hiddenTags.forEach((tag) => {
      tag.style.display = "none";
    });

    const chip = existing ?? this.createChip(work, tagList);
    this.renderChip(chip, work);
  }

  private createChip(work: HTMLElement, tagList: Element): HTMLLIElement {
    const chip = document.createElement("li");
    chip.className = CHIP_CLASS;

    const link = document.createElement("a");
    // Deliberately not class="tag": tag scripts must never process it.
    // Styled inline to read as a quiet annotation at tag size — the
    // raised button treatment is for shadow-DOM controls, not tag lists.
    link.setAttribute("role", "button");
    link.tabIndex = 0;
    link.style.cursor = "pointer";
    link.style.opacity = "0.7";
    link.style.fontStyle = "italic";

    const toggle = (event: Event) => {
      event.preventDefault();
      this.toggleReveal(work);
      this.renderChip(chip, work);
    };

    link.addEventListener("click", toggle);
    link.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        toggle(event);
      }
    });

    chip.append(link);
    tagList.append(chip);

    return chip;
  }

  private renderChip(chip: HTMLLIElement, work: HTMLElement): void {
    const count = work.querySelectorAll(HIDDEN_TAG_SELECTOR).length;
    const revealed = work.dataset.toyboxTagsRevealed === "true";
    const link = chip.querySelector("a");

    if (!link) {
      return;
    }

    link.textContent = revealed
      ? `hide ${String(count)} tag${count === 1 ? "" : "s"}`
      : `+${String(count)} hidden tag${count === 1 ? "" : "s"}`;
    link.setAttribute("aria-pressed", String(revealed));
  }

  private toggleReveal(work: HTMLElement): void {
    const revealed = work.dataset.toyboxTagsRevealed === "true";
    const hiddenTags = work.querySelectorAll<HTMLElement>(HIDDEN_TAG_SELECTOR);

    // The marker stays untouched either way — reveal is display-only,
    // so tag-highlighter and the tag manager keep full ownership of it.
    hiddenTags.forEach((tag) => {
      tag.style.display = revealed ? "none" : "";
    });

    if (revealed) {
      delete work.dataset.toyboxTagsRevealed;
    } else {
      work.dataset.toyboxTagsRevealed = "true";
    }
  }
}
