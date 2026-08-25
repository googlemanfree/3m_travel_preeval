import { describe, expect, it } from "vitest";
import { canonicalRedirectFromHosts, canonicalRedirectTarget, OFFICIAL_SITE_ORIGIN } from "./canonicalDomain";
import fs from "node:fs";
import path from "node:path";

describe("domaine officiel 3M Travel", () => {
  it("redirige les deux variantes .click vers www.3mtravelagency.com en conservant le chemin", () => {
    expect(canonicalRedirectTarget("3mtravelagency.click", "/procedures?country=CA")).toBe("https://www.3mtravelagency.com/procedures?country=CA");
    expect(canonicalRedirectTarget("www.3mtravelagency.click", "/sitemap.xml")).toBe("https://www.3mtravelagency.com/sitemap.xml");
  });

  it("laisse le domaine officiel et les aperçus locaux sans redirection", () => {
    expect(canonicalRedirectTarget("www.3mtravelagency.com", "/")).toBeNull();
    expect(canonicalRedirectTarget("localhost", "/")).toBeNull();
    expect(OFFICIAL_SITE_ORIGIN).toBe("https://www.3mtravelagency.com");
  });

  it("reconnaît l’hôte original à travers plusieurs en-têtes de proxy", () => {
    expect(canonicalRedirectFromHosts(["internal.railway.local", "3mtravelagency.click"], "/contact")).toBe("https://www.3mtravelagency.com/contact");
    expect(canonicalRedirectFromHosts(["internal", "www.3mtravelagency.click, internal"], "/sitemap.xml")).toBe("https://www.3mtravelagency.com/sitemap.xml");
  });

  it("conserve un repli navigateur lorsqu’un proxy ne transmet pas l’hôte externe", () => {
    const indexHtml = fs.readFileSync(path.resolve(import.meta.dirname, "../client/index.html"), "utf8");
    expect(indexHtml).toContain('"3mtravelagency.click": true');
    expect(indexHtml).toContain("window.location.replace");
    expect(indexHtml).toContain("https://www.3mtravelagency.com");
  });
});
