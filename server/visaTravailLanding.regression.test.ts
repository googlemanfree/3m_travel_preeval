import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const template =
  '<!doctype html><html lang="fr"><head><title>x</title></head><body><div id="root"><!--prerender-app--></div></body></html>';

describe("hub premium /travail", () => {
  it("expose la route App, le redirect et le câblage public", () => {
    const app = read("client/src/App.tsx");
    expect(app).toContain('path={"/travail"} component={VisaTravail}');
    expect(app).toContain('Redirect to="/travail"');

    const page = read("client/src/pages/VisaTravail.tsx");
    expect(page).toContain("3M TRAVEL AGENCY");
    expect(page).toContain("PremiumCoverImage");
    expect(page).toContain("/?project=travail#evaluation-multi");
    expect(page).toContain("getDestinationVisual");

    expect(read("client/src/pages/ProceduresAdvanced.tsx")).toContain('href="/travail"');
    expect(read("client/src/data/serviceCatalog.ts")).toContain('href: "/travail"');
    expect(read("client/src/components/NavbarSearchBar.tsx")).toContain("path: '/travail'");
    expect(read("client/public/sitemap.xml")).toContain("https://www.3mtravelagency.com/travail");
  });

  it("pré-rend le hub travail avec destinations et CTA", () => {
    const result = composePublicPrerender(template, "/travail");
    expect(result.status).toBe(200);
    expect(result.html).toContain("Travailler à l’international");
    expect(result.html).toContain("/?project=travail#evaluation-multi");
    expect(result.html).toContain("/procedures/allemagne-travail");
    expect(result.html).toContain("Visa travail &amp; mobilité professionnelle");
  });
});
