import { Color } from "@src/common/color";
import {
  PROGRESS_BAR_THICKNESS_PX,
  progressBarGeometry,
  type ProgressBarGeometry,
} from "@src/common/progress-bar";
import { render } from "preact";
import { ContentScript } from "../content-script";

const STYLE_CONSTANTS = {
  bar: {
    transform: "transform 0.5s ease-in-out",
  },
  // Follows the theme injector's accent when its variables are present;
  // the fallbacks keep the original tailwind look otherwise
  colors: {
    base: Color.tailwind.slate[200],
    marker: Color.tailwind.slate[500],
    progress: {
      start: `var(--ao3-accent-color, ${Color.tailwind.red[500]})`,
      end: `var(--ao3-accent-color-hover, ${Color.tailwind.red[600]})`,
    },
  },
  opacity: {
    background: "0.25",
    marker: "0.7",
  },
} as const;

export default class ProgressBar extends ContentScript {
  private chaptersContainer: HTMLDivElement | null = null;
  private chapters: NodeListOf<HTMLDivElement> | null = null;
  private hasMultipleChapters = false;
  private chapterMarkers: number[] = [];
  private geometry: ProgressBarGeometry = progressBarGeometry("top");

  getEnabled(): boolean {
    const hasWorksInUrl = window.location.pathname.includes("/works/");
    const hasWorkIdInUrl = /\/works\/(\d+)/.exec(window.location.pathname);

    return (
      hasWorksInUrl &&
      Boolean(hasWorkIdInUrl) &&
      this.settings.enableProgressBar
    );
  }

  async onProcess(): Promise<void> {
    this.geometry = progressBarGeometry(this.settings.progressBarPosition);

    const validator = document.querySelector(
      "div#workskin>div#chapters>div.chapter",
    );
    this.chaptersContainer = document.querySelector("div#chapters");

    if (validator && this.chaptersContainer) {
      this.chapters = this.chaptersContainer.querySelectorAll(
        "div#chapters>div.chapter",
      );
      this.processMultiple();

      return;
    }

    this.processOneShot();
  }

  private processOneShot(): void {
    this.injectProgressBar();
  }

  private processMultiple(): void {
    if (this.chapters && this.chapters.length > 1) {
      this.hasMultipleChapters = true;
      this.calculateChapterMarkers();
    }

    this.injectProgressBar();
  }

  private calculateChapterMarkers(): void {
    if (!this.chapters || !this.chaptersContainer) return;

    const totalHeight = this.chaptersContainer.offsetHeight;
    let accumulatedHeight = 0;

    for (let i = 0; i < this.chapters.length - 1; i++) {
      accumulatedHeight += this.chapters[i].offsetHeight;
      this.chapterMarkers.push((accumulatedHeight / totalHeight) * 100);
    }
  }

  private injectProgressBar(): void {
    const container = document.createElement("div");
    document.body.appendChild(container);

    render(this.renderProgressBarUI(), container);

    window.addEventListener("scroll", () => {
      this.handleScroll();
    });
  }

  private renderProgressBarUI() {
    return (
      <div style={{ position: "relative" }}>
        {/* Main progress container */}
        {this.renderProgressBarContainer()}

        {/* Progress indicator */}
        {this.renderProgressIndicator()}

        {/* Chapter markers */}
        {this.hasMultipleChapters && this.renderChapterMarkers()}
      </div>
    );
  }

  private renderProgressBarContainer() {
    return (
      <div
        style={{
          position: "fixed",
          ...this.geometry.anchor,
          backgroundColor: STYLE_CONSTANTS.colors.base,
          opacity: STYLE_CONSTANTS.opacity.background,
          zIndex: "999",
          transition: STYLE_CONSTANTS.bar.transform,
          transform: this.geometry.offscreenTransform,
        }}
        id="progressBarContainer"
      />
    );
  }

  private renderProgressIndicator() {
    // The fill grows along the reading axis from the track's start edge
    return (
      <div
        id="progressBar"
        style={{
          position: "fixed",
          ...this.geometry.anchor,
          [this.geometry.fillProperty]: "0%",
          background: `linear-gradient(${this.geometry.gradientDirection}, ${STYLE_CONSTANTS.colors.progress.start}, ${STYLE_CONSTANTS.colors.progress.end})`,
          zIndex: "1000",
          transition: `${this.geometry.fillProperty} 0.1s, ${STYLE_CONSTANTS.bar.transform}`,
          transform: this.geometry.offscreenTransform,
        }}
      />
    );
  }

  private renderChapterMarkers() {
    const thickness = `${String(PROGRESS_BAR_THICKNESS_PX)}px`;

    return this.chapterMarkers.map((position) => (
      <div
        key={position}
        role="presentation"
        style={{
          position: "fixed",
          ...this.geometry.anchor,
          [this.geometry.fillProperty]: thickness,
          [this.geometry.markerOffsetProperty]: `${String(position)}%`,
          [this.geometry.markerBorderProperty]:
            `2px solid ${STYLE_CONSTANTS.colors.marker}`,
          opacity: STYLE_CONSTANTS.opacity.marker,
          backgroundColor: "rgba(0,0,0,0)",
          zIndex: "1001",
          transition: STYLE_CONSTANTS.bar.transform,
          transform: this.geometry.offscreenTransform,
        }}
        id={`chapterMarker-${String(position)}`}
      />
    ));
  }

  private handleScroll(): void {
    if (!this.chaptersContainer) return;

    const progress = this.calculateScrollProgress();
    this.updateProgressBar(progress);
  }

  private calculateScrollProgress(): number {
    if (!this.chaptersContainer) return 0;

    const chaptersRect = this.chaptersContainer.getBoundingClientRect();
    const chaptersTop = chaptersRect.top + window.scrollY;
    const chaptersHeight = this.chaptersContainer.offsetHeight;
    const viewportHeight = window.innerHeight;
    const scrollPosition = window.scrollY;
    const chaptersEnd = chaptersTop + chaptersHeight;

    if (scrollPosition + viewportHeight > chaptersTop) {
      return (
        ((scrollPosition + viewportHeight - chaptersTop) /
          (chaptersEnd - chaptersTop)) *
        100
      );
    }

    return 0;
  }

  private updateProgressBar(progress: number): void {
    const progressBar = document.getElementById("progressBar");
    const progressBarContainer = document.getElementById(
      "progressBarContainer",
    );

    if (progressBar) {
      const clamped = Math.min(Math.max(progress, 0), 100);
      progressBar.style[this.geometry.fillProperty] = `${String(clamped)}%`;
      progressBar.style.transform = this.getTransformStyle(progress);
    }

    if (progressBarContainer) {
      progressBarContainer.style.transform = this.getTransformStyle(progress);
    }

    if (this.hasMultipleChapters) {
      this.updateChapterMarkers(progress);
    }
  }

  private updateChapterMarkers(progress: number): void {
    this.chapterMarkers.forEach((position) => {
      const marker = document.getElementById(
        `chapterMarker-${String(position)}`,
      );

      if (marker) {
        marker.style.transform = this.getTransformStyle(progress);
      }
    });
  }

  private getTransformStyle(progress: number): string {
    return progress <= 0 ? this.geometry.offscreenTransform : "translate(0)";
  }
}
