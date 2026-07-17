import { ContentScript } from "../content-script";

export default class OpenInNewTab extends ContentScript {
  getEnabled(): boolean {
    return this.settings.enableOpenInNewTab;
  }
  async onProcess(): Promise<void> {
    // Don't run on work pages themselves
    const currentPath = window.location.pathname;

    if (/^\/works\/\d+/.test(currentPath)) {
      this.logger.log("Skipping: already on a work page");

      return;
    }

    const allLinks = document.querySelectorAll("a");

    const filteredLinks = Array.from(allLinks).filter((link) => {
      const regex = /^\/works\/\d+$/;
      const href = link.pathname;

      return href && regex.test(href);
    });

    filteredLinks.forEach((link) => {
      link.target = "_blank";
    });

    this.logger.log(`Processed ${String(filteredLinks.length)} works`);
  }
}
