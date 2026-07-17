import { ContentScript } from "../content-script";

export default class KeyboardPagination extends ContentScript {
  private paginationElement: Element | null = null;
  private previousLink: HTMLAnchorElement | null = null;
  private nextLink: HTMLAnchorElement | null = null;

  getEnabled(): boolean {
    // Check if pagination exists on the page
    this.paginationElement = document.querySelector(
      'ol.pagination.actions[title="pagination"]',
    );

    return (
      this.settings.enableKeyboardPagination && this.paginationElement !== null
    );
  }

  async onProcess(): Promise<void> {
    // Get the previous and next links
    this.previousLink =
      this.paginationElement?.querySelector("li.previous > a") ?? null;
    this.nextLink =
      this.paginationElement?.querySelector("li.next > a") ?? null;

    // Add keyboard event listener
    document.addEventListener("keydown", this.handleKeyPress.bind(this));

    this.logger.log("Keyboard pagination initialized");
    if (this.previousLink) this.logger.log("Previous page available");
    if (this.nextLink) this.logger.log("Next page available");
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
          this.logger.log("Navigating to previous page");
          this.previousLink.click();
        }

        break;
      case "ArrowRight":
        if (this.nextLink) {
          event.preventDefault();
          this.logger.log("Navigating to next page");
          this.nextLink.click();
        }

        break;
      default:
    }
  }
}
