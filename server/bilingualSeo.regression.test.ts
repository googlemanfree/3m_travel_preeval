import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("SEO bilingue FR/EN", () => {
  const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

  it("déclare les routes EN et les quatre slugs traduits", () => {
    const app = read("client/src/App.tsx");
    const englishCatalog = read("client/src/data/procedures107English.ts");
    const home = read("client/src/pages/EnHome.tsx");

    expect(home).toContain("3M Travel & Services supports");
    expect(app).toContain('path={"/en"}');
    expect(app).toContain('path="/en/procedures/:countryId"');
    expect(app).toContain('path="/en/destinations/:countryId"');
    for (const slug of ["canada-work", "france-study", "germany-work", "dubai-evisa"]) {
      expect(englishCatalog).toContain(`enSlug: "${slug}"`);
    }
  });

  it("prépare le prerendu, le sitemap et les alternates hreflang FR/EN", () => {
    const prerender = read("server/publicPrerender.ts");

    expect(prerender).toContain("procedureMetaForPathEn");
    expect(prerender).toContain("HREFLANG_PAIRS");
    expect(prerender).toContain('"/en": "/"');
    expect(prerender).toContain("x-default");
    expect(prerender).toContain("hreflang");
    expect(prerender).toContain("getIndexablePublicPaths");
    expect(prerender).toContain("/en/procedures/");
    expect(prerender).toContain("og:locale");
    expect(prerender).toContain("inLanguage");
  });
});
