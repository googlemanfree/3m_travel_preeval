import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), "utf8");

describe("audit confiance & conversion — corrections publiques", () => {
  it("aligne l’adresse Yaoundé (texte + carte) et enrichit le prerender de /", () => {
    const contacts = read("client/src/lib/companyContacts.ts");
    const prerender = read("server/publicPrerender.ts");
    expect(contacts).toContain('mapQuery: "Biyem-Assi, Montée Chapelle Obili, Yaoundé, Cameroun"');
    expect(contacts).not.toContain("Avenue Marché Biyem-Assi");
    expect(contacts).toContain("Montée Chapelle Obili");
    expect(prerender).toContain('aria-label="Bureaux"');
    expect(prerender).toContain("yaounde.addressLines");
    expect(prerender).toContain("Évaluation gratuite (sans compte pour démarrer)");
  });

  it("clarifie le CTA évaluation (compte + CV) près des boutons principaux", () => {
    const hero = read("client/src/components/HeroSectionVIP.tsx");
    const brand = read("client/src/data/internationalBrand.ts");
    const home = read("client/src/pages/Home.tsx");
    expect(brand).toContain("evaluateHint");
    expect(brand).toContain("Créer un compte gratuit, puis déposer mon CV");
    expect(hero).toContain("hero-eval-hint");
    expect(home).toContain("Créer un compte gratuit, puis déposer mon CV");
  });

  it("sépare clairement WhatsApp et e-mail sur Contact", () => {
    const panel = read("client/src/components/OfficeContactPanel.tsx");
    const contact = read("client/src/pages/Contact.tsx");
    expect(panel).toContain("Parcours WhatsApp");
    expect(panel).toContain("n’envoie rien au site");
    expect(contact).toContain("Message par e-mail à l’agence");
    expect(contact).toContain("Envoyer le message par e-mail");
    expect(contact).toContain("contact-email-form");
  });

  it("publie des tarifs concrets et renforce les CGU", () => {
    const tarifs = read("client/src/pages/Tarifs.tsx");
    const enrichment = read("client/src/data/pageEnrichment.ts");
    const cgu = read("client/src/pages/ConditionsUtilisation.tsx");
    expect(enrichment).toContain("TARIFS_CONCRETE_BLOCKS");
    expect(enrichment).toMatch(/65[\s .]?000\s*FCFA/);
    expect(tarifs).toContain("tarifs-concrete");
    expect(cgu).toContain("Modalités de paiement");
    expect(cgu).toContain("Annulation et remboursement");
    expect(cgu).toContain("Réclamations");
    expect(cgu).toContain("14 octobre 2026");
  });

  it("sert des preuves via /proof-photos (pas de manus-storage manquant) et compacte l’annuaire", () => {
    const proofs = read("client/src/data/proofPhotos.ts");
    const procedures = read("client/src/pages/ProceduresAdvanced.tsx");
    const portals = read("client/src/data/officialConsularPortals.ts");
    expect(proofs).not.toMatch(/\/manus-storage\/proof-/);
    expect(proofs).toContain("/proof-photos/");
    expect(procedures).toContain("procedures-toggle-advanced-filters");
    expect(procedures).toContain("Voir la fiche");
    expect(procedures).not.toContain("Détails de la procédure & Culture");
    expect(portals).toContain("14 octobre 2026");
    expect(portals).not.toContain("19 août 2026");
    expect(read("client/src/data/evisasDatabaseComplete.ts")).toContain('officialVerifiedAt = "14 octobre 2026"');
    expect(read("client/src/data/evisasDatabaseComplete.ts")).not.toContain("17 août 2026");
  });

  it("purge le service worker pour le lot audit confiance", () => {
    expect(read("client/public/sw.js")).toMatch(/3m-travel-pwa-v\d+/);
  });
});
