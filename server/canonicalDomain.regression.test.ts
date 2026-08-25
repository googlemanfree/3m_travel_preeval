import { describe, expect, it } from "vitest";
import { canonicalRedirectTarget, OFFICIAL_SITE_ORIGIN } from "./canonicalDomain";

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
});
