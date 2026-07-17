declare module "tailwindcss-primeui" {
  import type { Config } from "tailwindcss";
  const plugin: Config["plugins"][number];
  export default plugin;
}
