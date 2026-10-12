/**
 * SEO client léger (title, description, og:image) pour les pages SPA.
 * Le prerender serveur reste la source canonique pour le crawl initial.
 */

type PageSeoInput = {
  title: string;
  description: string;
  /** Chemin absolu site (`/photos-pays/...`) ou URL absolue. */
  image?: string | null;
  imageAlt?: string;
};

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (typeof window === "undefined") return pathOrUrl;
  return `${window.location.origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function setPageSeo({ title, description, image, imageAlt }: PageSeoInput) {
  if (typeof document === "undefined") return;
  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  if (image) {
    const url = absoluteUrl(image);
    upsertMeta("property", "og:image", url);
    upsertMeta("name", "twitter:image", url);
    if (imageAlt) upsertMeta("property", "og:image:alt", imageAlt);
  }
}
