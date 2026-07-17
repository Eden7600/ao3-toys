import { existsSync } from "fs";
import { resolve } from "path";
import getManifest from "../../src/manifest";

type DetectedScripts = {
  contentScripts: Array<{
    entry: string;
    outPath: string;
  }>;
  backgroundScripts: Array<{
    entry: string;
    outPath: string;
  }>;
  uiPages: Array<{
    entry: string;
    outPath: string;
  }>;
};

export function detectScripts(): DetectedScripts {
  const manifest = getManifest();
  const detected: DetectedScripts = {
    contentScripts: [],
    backgroundScripts: [],
    uiPages: [],
  };

  // Helper to resolve paths relative to src
  const resolveSrcPath = (path: string) =>
    resolve(process.cwd(), "src", path.replace(/^\.\//, ""));

  // Helper to check if file exists and add it with output path
  const addIfExists = (
    entry: string,
    outPath: string,
    array: Array<{ entry: string; outPath: string }>,
  ) => {
    const resolvedPath = resolveSrcPath(entry);

    if (existsSync(resolvedPath)) {
      array.push({ entry: resolvedPath, outPath });
    }
  };

  // Detect content scripts
  manifest.content_scripts?.forEach((script) => {
    if (script.js) {
      script.js.forEach((path) => {
        addIfExists(path, path, detected.contentScripts);
      });
    }
  });

  // Detect background scripts
  if (manifest.background) {
    if ("scripts" in manifest.background && manifest.background.scripts) {
      manifest.background.scripts.forEach((path) => {
        addIfExists(path, path, detected.backgroundScripts);
      });
    }

    if (
      "service_worker" in manifest.background &&
      manifest.background.service_worker
    ) {
      addIfExists(
        manifest.background.service_worker,
        manifest.background.service_worker,
        detected.backgroundScripts,
      );
    }
  }

  // Detect UI pages
  if (manifest.options_ui?.page) {
    const resolvedPath = resolveSrcPath(manifest.options_ui.page);

    if (existsSync(resolvedPath)) {
      detected.uiPages.push({ entry: resolvedPath, outPath: "options_ui" });
    }
  }

  if (manifest.devtools_page) {
    const resolvedPath = resolveSrcPath(manifest.devtools_page);

    if (existsSync(resolvedPath)) {
      detected.uiPages.push({ entry: resolvedPath, outPath: "devtools" });
    }
  }

  if (manifest.action?.default_popup) {
    const resolvedPath = resolveSrcPath(manifest.action.default_popup);

    if (existsSync(resolvedPath)) {
      detected.uiPages.push({ entry: resolvedPath, outPath: "popup" });
    }
  }

  return detected;
}
