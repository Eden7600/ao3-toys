import { Logger } from "@src/common/logger";
const logger = new Logger("CTS-Root");

import type { Browser } from "@src/common/constants";
import { getAllSettings } from "@src/common/settings";
import { ContentScript, type ContentScriptModule } from "./content-script";
import { ContentScriptManager } from "./content-script-manager";

const observer = new MutationObserver((mutationsList) => {
  scriptManager.handleMutations(mutationsList).catch((error: unknown) => {
    logger.error(
      `Failed to handle mutations: ${error instanceof Error ? error.message : String(error)}`,
    );
  });
});

const scriptManager = new ContentScriptManager(logger);

async function start(): Promise<void> {
  logger.log("Starting ContentScript System");

  const allScripts = {
    ...import.meta.glob<ContentScriptModule>("./scripts/*.ts"),
    ...import.meta.glob<ContentScriptModule>("./scripts/*.tsx"),
  };

  try {
    // Only load settings once and pass them to all scripts
    const settings = await getAllSettings();
    logger.log("Loaded settings", settings);

    // Pull the browser from the ENV
    const browser = process.env.BROWSER as Browser;

    for (const path in allScripts) {
      if (!Object.hasOwn(allScripts, path)) continue;
      // eslint-disable-next-line no-await-in-loop
      const scriptModule = await allScripts[path]();

      if (scriptModule.default.prototype instanceof ContentScript) {
        // eslint-disable-next-line new-cap
        const scriptInstance = new scriptModule.default(settings, browser);
        scriptManager.addScript(scriptInstance);
      } else {
        logger.error(
          `Module at ${path} does not have a valid default export extending ContentScript, skipping`,
        );
      }
    }

    scriptManager.triggerAll().catch((error: unknown) => {
      logger.error(
        `Failed to trigger content scripts: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  } catch (error) {
    logger.error(
      `Failed to start PageProcessor module: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  observer.observe(document.body, { attributes: true });
}

void start();
