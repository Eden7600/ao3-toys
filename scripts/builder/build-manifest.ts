import { writeFile, mkdir } from "fs/promises";
import { resolve } from "path";
import getManifest from "../../src/manifest";
import type { Args } from "./args";

export async function buildManifest(args: Args) {
  const manifest = getManifest();
  const outDir = resolve(process.cwd(), `dist/${args.browser}`);

  // Transform file extensions in manifest
  const transformExtensions = (obj: Record<string, unknown> | null) => {
    if (!obj || typeof obj !== "object") return obj;

    const transformed = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        (transformed as Record<string, unknown>)[key] = value.replace(
          /\.ts$/,
          ".js",
        );
      } else if (value && typeof value === "object") {
        (transformed as Record<string, unknown>)[key] = transformExtensions(
          value as Record<string, unknown>,
        );
      } else {
        (transformed as Record<string, unknown>)[key] = value;
      }
    }

    return transformed;
  };

  const transformedManifest = transformExtensions(manifest);

  await mkdir(outDir, { recursive: true });
  await writeFile(
    resolve(outDir, "manifest.json"),
    JSON.stringify(transformedManifest, null, 2),
  );
}
