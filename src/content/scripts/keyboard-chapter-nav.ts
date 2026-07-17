import { ContentScript } from "../content-script";

export default class KeyboardChapterNav extends ContentScript {
  private paginationElement: Element | null = null;
  private previousLink: HTMLAnchorElement | null = null;
  private nextLink: HTMLAnchorElement | null = null;

  getEnabled(): boolean {
    // Check if pagination exists on the page
    this.paginationElement = document.querySelector(
      "ul.work.navigation.actions",
    );

    return (
      this.settings.enableKeyboardPagination && this.paginationElement !== null
    );
  }

  async onProcess(): Promise<void> {
    // Get the previous and next links
    this.previousLink =
      this.paginationElement?.querySelector("li.chapter.previous > a") ?? null;
    this.nextLink =
      this.paginationElement?.querySelector("li.chapter.next > a") ?? null;

    // Add keyboard event listener
    document.addEventListener("keydown", this.handleKeyPress.bind(this));

    this.logger.log("Keyboard chapter navigation initialized");
    if (this.previousLink) this.logger.log("Previous chapter available");
    if (this.nextLink) this.logger.log("Next chapter available");
  }

  private handleKeyPress(event: KeyboardEvent): void {
    // Ignore if user is typing in an input or textarea
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        if (this.previousLink) {
          event.preventDefault();
          this.logger.log("Navigating to previous chapter");
          this.previousLink.click();
        }

        break;
      case "ArrowRight":
        if (this.nextLink) {
          event.preventDefault();
          this.logger.log("Navigating to next chapter");
          this.nextLink.click();
        }

        break;
      default:
    }
  }
}
