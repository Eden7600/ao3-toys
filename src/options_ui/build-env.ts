// The custom builder injects NODE_ENV via Vite `define` (it never sets a
// Vite mode, so import.meta.env.DEV is NOT reliable here — it would report
// production even for dev builds).
export const isDevBuild = process.env.NODE_ENV === "development";
