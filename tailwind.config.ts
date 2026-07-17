import type { Config } from "tailwindcss";
import primeui from "tailwindcss-primeui";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,vue,html}"],
  darkMode: "class",
  plugins: [primeui],
};

export default config;
