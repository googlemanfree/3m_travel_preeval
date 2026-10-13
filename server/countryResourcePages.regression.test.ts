import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  countryNameToSlug,
  countryResourceLead,
  countCountryResourcePages,
  getCountryResourcePage,
  listCountryResourcePages,
  primaryEvalProjectForPage,
  resourceLibraryPathForCountry,
  visualSlugForCountry,
} from "../shared/countryResourceCatalog";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const template = "<!doctype html><html lang=\"fr\"><head><title>x</title></head><body><div id=\"root\"><!--prerender-app--></div></body></html>";

describe("pages ressources par pays", () => {
  it("génère une page par pays à partir du catalogue PDF", () => {
    const pages = listCountryResourcePages();
    expect(pages.length).toBeGreaterThanOrEqual(40);
    expect(countCountryResourcePages()).toBe(pages.length);
    const canada = getCountryResourcePage("canada");
    expect(canada?.path).toBe("/ressources/canada");
    expect(canada?.resources.length).toBeGreaterThanOrEqual(3);
    expect(canada?.categories).toEqual(expect.arrayContaining(["travail", "etudes"]));
    expect(countryNameToSlug("Rép. Tchèque")).toBe("republique-tcheque");
    expect(countryNameToSlug("Dubaï / EAU")).toBe("emirats");
    expect(resourceLibraryPathForCountry("Luxembourg")).toBe("/ressources/luxembourg");
    expect(primaryEvalProjectForPage(canada!)).toBe("travail");
    expect(countryResourceLead(canada!, "fr")).toMatch(/Canada/i);
    expect(visualSlugForCountry("Turquie")).toBe("emirats");
    expect(visualSlugForCountry("Hongrie")).toBe("pologne");
  });

  it("expose la route App et la sync admin / candidat", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('path={"/ressources/:countrySlug"}');
    expect(app).toContain("ResourceCountryPage");

    const hub = read("client/src/pages/Ressources.tsx");
    expect(hub).toContain("listCountryResourcePages");
    expect(hub).toContain("PremiumCoverImage");
    expect(hub).toContain("3M TRAVEL AGENCY");
    expect(hub).toContain("Évaluer mon profil");

    const countryPage = read("client/src/pages/ResourceCountryPage.tsx");
    expect(countryPage).toContain("getCountryResourcePage");
    expect(countryPage).toContain("getDestinationVisual");
    expect(countryPage).toContain("primaryEvalProjectForPage");
    expect(countryPage).toContain("countryResourceLead");

    expect(read("client/src/components/PublishedGuideSummaryPanel.tsx")).toContain("resourceLibraryHref");
    expect(read("client/src/components/CandidateCountryJourney.tsx")).toContain("officialPortalUrl");
    expect(read("client/src/components/ProcedureStepper.tsx")).toContain("officialPortalUrl");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("admin-resource-library-link");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("admin-official-portal-link");
    expect(read("shared/candidateJourneyCatalog.ts")).toContain("officialPortalUrl");
  });

  it("pré-rend le hub et une page pays Canada", () => {
    const hub = composePublicPrerender(template, "/ressources");
    expect(hub.status).toBe(200);
    expect(hub.html).toContain("Guides PDF par destination");
    expect(hub.html).toContain("/ressources/canada");
    expect(hub.html).toContain("/ressources/luxembourg");
    expect((hub.html.match(/\/ressources\//g) || []).length).toBeGreaterThanOrEqual(40);

    const canada = composePublicPrerender(template, "/ressources/canada");
    expect(canada.status).toBe(200);
    expect(canada.html).toContain("Guides Canada");
    expect(canada.html).toContain("Visa Travail — Canada");
    expect(canada.html).toMatch(/IRCC/i);
  });
});
