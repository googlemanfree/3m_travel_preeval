import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { OFFICE_CONTACTS, officeMapsUrl } from "../client/src/lib/officeContacts";
import { PUBLIC_DESTINATION_PAGE_COUNT } from "../client/src/lib/publicDestinationCatalog";

describe("découverte publique des procédures et contact", () => {
  it("base la recherche de l’annuaire sur le catalogue canonique des 107 fiches", () => {
    const page = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/ProceduresAdvanced.tsx"), "utf8");
    expect(PUBLIC_DESTINATION_PAGE_COUNT).toBeGreaterThanOrEqual(107);
    expect(page).toContain("PUBLIC_DESTINATION_DETAILS.map");
    expect(page).toContain('id="procedure-country-search"');
    expect(page).toContain('aria-live="polite"');
  });

  it("expose un itinéraire Google Maps pour le bureau principal et des titres de carte accessibles", () => {
    const contact = fs.readFileSync(path.resolve(process.cwd(), "client/src/pages/Contact.tsx"), "utf8");
    expect(officeMapsUrl(OFFICE_CONTACTS.cameroon)).toContain("Avenue%20March%C3%A9%20Biyem-Assi%2C%20Yaound%C3%A9%2C%20Cameroun");
    expect(contact).toContain("Carte interactive — {cameroon.shortLabel}");
    expect(contact).toContain("Ouvrir l’itinéraire vers Yaoundé");
    expect(contact).toContain("Carte interactive du ${cameroon.label}");
  });
});
