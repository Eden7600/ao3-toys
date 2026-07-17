import { STACKED_STATS_CSS } from "@src/common/blurb-stats";
import { ContentScript } from "../content-script";

export default class StatLayout extends ContentScript {
  getEnabled(): boolean {
    return this.settings.stackBlurbStats;
  }

  async onPreProcess(): Promise<void> {
    if (document.body.dataset.toyboxStatLayoutStyles) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.textContent = STACKED_STATS_CSS;
    document.head.appendChild(styleElement);
    document.body.dataset.toyboxStatLayoutStyles = "true";

    this.logger.log("Injected stacked stat layout styles");
  }
}
