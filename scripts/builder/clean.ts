import { rm } from "fs/promises";
import { resolve } from "path";
import type { Args } from "./args";

export async function cleanDist(args: Args) {
  const outDir = resolve(process.cwd(), `dist/${args.browser}`);
  await rm(outDir, { recursive: true, force: true });
}
