/**
 * The extension ships with no server — anyone can run a compatible one and
 * point the extension at it. A base URL is only usable once it parses as
 * http(s); everything else (including the empty default) means "no server".
 */
export function normalizeServerUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, "");

  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return trimmed;
}
