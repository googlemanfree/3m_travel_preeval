import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  countryNameToSlug,
  countCountryResourcePages,
  getCountryResourcePage,
  listCountryResourcePages,
  resourceLibraryPathForCountry,
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
  });

  it("expose la route App et la sync admin / candidat", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('path={"/ressources/:countrySlug"}');
    expect(app).toContain("ResourceCountryPage");

    const hub = read("client/src/pages/Ressources.tsx");
    expect(hub).toContain("listCountryResourcePages");
    expect(hub).toContain("PremiumCoverImage");
    expect(hub).toContain("3M TRAVEL AGENCY");

    const countryPage = read("client/src/pages/ResourceCountryPage.tsx");
    expect(countryPage).toContain("getCountryResourcePage");
    expect(countryPage).toContain("getDestinationVisual");

    expect(read("client/src/components/PublishedGuideSummaryPanel.tsx")).toContain("resourceLibraryHref");
    expect(read("client/src/components/CandidateCountryJourney.tsx")).toContain("resourceLibraryPathForCountry");
    expect(read("client/src/components/ProcedureStepper.tsx")).toContain("resourceLibraryPathForCountry");
    expect(read("client/src/pages/AdminDashboard.tsx")).toContain("admin-resource-library-link");
  });

  it("pré-rend le hub et une page pays Canada", () => {
    const hub = composePublicPrerender(template, "/ressources");
    expect(hub.status).toBe(200);
    expect(hub.html).toContain("Guides PDF par destination");
    expect(hub.html).toContain("/ressources/canada");

    const canada = composePublicPrerender(template, "/ressources/canada");
    expect(canada.status).toBe(200);
    expect(canada.html).toContain("Guides & procédures Canada");
    expect(canada.html).toContain("Visa Travail — Canada");
  });
});
