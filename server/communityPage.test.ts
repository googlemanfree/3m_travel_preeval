import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = (relativePath: string) => readFileSync(path.join(root, relativePath), "utf8");

describe("page communautaire 3M", () => {
  it("publie les expertises, les informations vérifiées et le contact Yaoundé", () => {
    const page = source("client/src/pages/Community.tsx");
    const contacts = source("client/src/lib/companyContacts.ts");
    expect(page).toContain("Service 3M Digital");
    expect(page).toContain("Sites web & plateformes");
    expect(page).toContain("Croissance digitale");
    expect(page).toContain("Infrastructure & support IT");
    expect(page).toContain("Formation professionnelle");
    expect(page).toContain("COMPANY_CONTACTS.yaounde.address");
    expect(contacts).toContain("Biyem-Assi, Montée Chapelle Obili");
    expect(contacts).toContain("237698104832");
    expect(contacts).toContain("hello@3mtravelagency.com");
  });

  it("relie la page aux routes, au menu et au pied de page sans dupliquer le contenu", () => {
    const app = source("client/src/App.tsx");
    const navbar = source("client/src/components/Navbar.tsx");
    const footer = source("client/src/components/Footer.tsx");
    expect(app).toContain('path={"/3m-digital"} component={Community}');
    expect(app).toContain('Redirect to="/3m-digital"');
    expect(app).toContain('path={"/admin/digital-services"}');
    expect(navbar).toContain('{ href: "/3m-digital", label: { fr: "3M Digital", en: "3M Digital" }');
    expect(footer).toContain("Service 3M Digital");
  });
});
