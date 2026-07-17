import blurbCardStyles from "../styles/blurb-card.scss?inline";
import { ContentScript } from "../content-script";

export default class BlurbCard extends ContentScript {
  getEnabled(): boolean {
    return this.settings.enableModernBlurbs;
  }

  async onPreProcess(): Promise<void> {
    if (document.body.dataset.toyboxBlurbCardStyles) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.textContent = blurbCardStyles;
    document.head.appendChild(styleElement);
    document.body.dataset.toyboxBlurbCardStyles = "true";

    this.logger.log("Injected modern blurb card styles");
  }
}
