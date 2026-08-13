const MAX_ENTRIES = 12;
const CACHE_TTL_MS = 30_000;

type CacheEntry = {
  promise: Promise<void>;
  expiresAt: number;
};

const routePrefetchCache = new Map<string, CacheEntry>();
const prefetchedLinks = new Set<string>();

function normalizeRoute(href: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.hash || url.pathname.startsWith("/api/")) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function evictOldestEntry() {
  if (routePrefetchCache.size < MAX_ENTRIES) return;
  const oldestKey = routePrefetchCache.keys().next().value as string | undefined;
  if (oldestKey) routePrefetchCache.delete(oldestKey);
}

/**
 * Warms the browser HTTP cache for a same-origin route. It never changes the
 * current URL, never stores user data, and silently fails when a route cannot
 * be prefetched so navigation remains a native-link operation.
 */
export function prefetchRoute(href: string): void {
  const route = normalizeRoute(href);
  if (!route) return;

  const now = Date.now();
  const cached = routePrefetchCache.get(route);
  if (cached && cached.expiresAt > now) return;
  if (cached) routePrefetchCache.delete(route);

  evictOldestEntry();

  const promise = fetch(route, {
    method: "GET",
    credentials: "include",
    cache: "force-cache",
    headers: { "X-3M-Prefetch": "1" },
  })
    .then(() => undefined)
    .catch(() => undefined);

  routePrefetchCache.set(route, { promise, expiresAt: now + CACHE_TTL_MS });
}

/**
 * Adds a native prefetch hint once per route. The in-memory fetch above is
 * still used as a fallback for browsers that ignore link-prefetch hints.
 */
export function addPrefetchHint(href: string): void {
  const route = normalizeRoute(href);
  if (!route || prefetchedLinks.has(route)) return;

  const existing = document.head.querySelector<HTMLLinkElement>(
    `link[rel="prefetch"][href="${CSS.escape(route)}"]`,
  );
  if (existing) {
    prefetchedLinks.add(route);
    return;
  }

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = route;
  link.as = "document";
  link.setAttribute("data-3m-route-prefetch", "true");
  document.head.appendChild(link);
  prefetchedLinks.add(route);
}

export function prefetchNavigation(href: string): void {
  addPrefetchHint(href);
  prefetchRoute(href);
}

export function clearNavigationCache(): void {
  routePrefetchCache.clear();
  document
    .querySelectorAll<HTMLLinkElement>('link[data-3m-route-prefetch="true"]')
    .forEach((link) => link.remove());
  prefetchedLinks.clear();
}
