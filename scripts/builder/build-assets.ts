import { cp, mkdir } from "fs/promises";
import { dirname, resolve } from "path";
import getManifest from "../../src/manifest";
import type { Args } from "./args";

export async function buildAssets(args: Args) {
  const manifest = getManifest();
  const outDir = resolve(process.cwd(), `dist/${args.browser}`);

  // Helper to resolve and copy paths
  const copyAsset = async (sourcePath: string) => {
    const resolvedSource = resolve(
      process.cwd(),
      "src",
      sourcePath.replace(/^\.\//, ""),
    );
    const resolvedTarget = resolve(outDir, sourcePath);

    // Create the target directory
    await mkdir(dirname(resolvedTarget), { recursive: true });

    // Copy the file
    await cp(resolvedSource, resolvedTarget, { recursive: true });
  };

  // Copy icons
  if (manifest.icons) {
    for (const path of Object.values(manifest.icons)) {
      if (path) {
        // eslint-disable-next-line no-await-in-loop
        await copyAsset(path);
      }
    }
  }
}
