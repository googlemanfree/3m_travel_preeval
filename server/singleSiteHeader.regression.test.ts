import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("en-tête du site", () => {
  it("est rendu une seule fois, par App.tsx : aucune page ne doit afficher son propre <Navbar />", () => {
    const app = readFileSync(resolve(root, "client/src/App.tsx"), "utf8");
    expect(app.match(/<Navbar \/>/g)?.length).toBe(1);

    const pagesDir = resolve(root, "client/src/pages");
    const offenders = readdirSync(pagesDir, { recursive: true })
      .map(String)
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => /<Navbar\b/.test(readFileSync(resolve(pagesDir, file), "utf8")));
    // Avant correction : AdminCustomerReviews, AdminConsultationRequests et EvisaDemande affichaient deux en-têtes empilés.
    expect(offenders).toEqual([]);
  });
});
