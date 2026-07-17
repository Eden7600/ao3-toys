import { type PluginOption } from "vite";
import customDynamicImport from "./plugins/custom-dynamic-import";
import inlineVitePreloadScript from "./plugins/inline-vite-preload-script";
import makeManifest from "./plugins/make-manifest";

export const getPlugins = (): PluginOption[] => [
  makeManifest(),
  customDynamicImport(),
  inlineVitePreloadScript(),
];
