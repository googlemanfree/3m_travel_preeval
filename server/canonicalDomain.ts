const OFFICIAL_ORIGIN = "https://www.3mtravelagency.com";
const LEGACY_HOSTS = new Set(["3mtravelagency.click", "www.3mtravelagency.click"]);

export function canonicalRedirectTarget(hostname: string | undefined, originalUrl: string) {
  const host = (hostname ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (!LEGACY_HOSTS.has(host)) return null;
  const path = originalUrl.startsWith("/") ? originalUrl : `/${originalUrl}`;
  return `${OFFICIAL_ORIGIN}${path}`;
}

export const OFFICIAL_SITE_ORIGIN = OFFICIAL_ORIGIN;
