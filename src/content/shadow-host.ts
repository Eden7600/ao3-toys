import { Color } from "@src/common/color";

/**
 * Classifies the page as light or dark by walking up from <body> until an
 * element with a non-transparent background is found. Falls back to
 * prefers-color-scheme, then light.
 */
export function detectPageTheme(): "light" | "dark" {
  for (let el: Element | null = document.body; el; el = el.parentElement) {
    const dark = Color.isDarkCssColor(getComputedStyle(el).backgroundColor);

    if (dark !== null) {
      return dark ? "dark" : "light";
    }
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export type ShadowMount = {
  /** Light-DOM host element; the only node page CSS can see. */
  host: HTMLDivElement;
  /** Container inside the closed shadow root to render UI into. */
  root: HTMLDivElement;
};

/**
 * Creates the standard isolated UI mount: a light-DOM host (styled only via
 * inline styles so page CSS can't restyle it) holding a closed shadow root
 * with the feature's stylesheet and an `all: initial` container stamped with
 * the detected page theme.
 */
export function createShadowHost(options: {
  css: string;
  hostStyle?: string;
  parent?: Element;
}): ShadowMount {
  const host = document.createElement("div");

  if (options.hostStyle) {
    host.style.cssText = options.hostStyle;
  }

  (options.parent ?? document.body).appendChild(host);

  const shadow = host.attachShadow({ mode: "closed" });

  const style = document.createElement("style");
  style.textContent = options.css;
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.className = "rt-root";
  root.dataset.theme = detectPageTheme();
  shadow.appendChild(root);

  return { host, root };
}
