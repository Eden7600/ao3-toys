import { AO3_DOMAINS } from "@src/common/ao3";

/**
 * Reduces an absolute AO3 URL (any of the AO3 domains, any subdomain) to
 * its path. Relative URLs and non-AO3 hosts pass through with only the
 * protocol removed, matching the previous behavior.
 */
export const stripBaseUrl = (url: string) => {
  const withoutProtocol = url.replace(/^(?:https?:)?\/\//, "");
  const slashIndex = withoutProtocol.indexOf("/");
  const host =
    slashIndex === -1 ? withoutProtocol : withoutProtocol.slice(0, slashIndex);
  const isAo3Host = AO3_DOMAINS.some(
    (domain) =>
      host.toLowerCase() === domain ||
      host.toLowerCase().endsWith(`.${domain}`),
  );

  if (!isAo3Host) {
    return withoutProtocol;
  }

  return slashIndex === -1 ? "" : withoutProtocol.slice(slashIndex);
};

export const cleanTagUrl = (url: string) => {
  return stripBaseUrl(url).replace("/works", "");
};
