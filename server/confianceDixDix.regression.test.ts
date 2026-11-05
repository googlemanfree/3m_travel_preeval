import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { composePublicPrerender } from "./publicPrerender";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const shell = "<!doctype html><html><head><title>Base</title></head><body><!--prerender-app--></body></html>";

describe("confiance 10/10 — preuves, tarifs, contacts, indexation", () => {
  it("expose une preuve d’enregistrement vérifiable sur l’accueil (UI + prerender)", () => {
    const home = read("client/src/pages/Home.tsx");
    const company = read("client/src/lib/companyContacts.ts");
    const html = composePublicPrerender(shell, "/").html;
    expect(home).toContain('data-testid="home-legal-registration-proof"');
    expect(home).toContain("registryPortalUrl");
    expect(company).toContain("RC/YAO/2019/A/2567");
    expect(company).toContain("rccm.ohada.org");
    expect(html).toContain("Preuve d’enregistrement vérifiable");
    expect(html).toContain("RC/YAO/2019/A/2567");
    expect(html).toContain("rccm.ohada.org");
  });

  it("clarifie paiement, inclus et annulation/remboursement sur Tarifs", () => {
    const tarifs = read("client/src/pages/Tarifs.tsx");
    expect(tarifs).toContain('data-testid="tarifs-payment-cancel"');
    expect(tarifs).toContain("Étapes de paiement");
    expect(tarifs).toContain("Annulation et remboursement");
    expect(tarifs).toContain("Pas de remboursement automatique");
    expect(composePublicPrerender(shell, "/tarifs").html).toContain("Étapes de paiement");
  });

  it("harmonise les rôles WhatsApp / fixe / Ottawa et les horaires Ottawa", () => {
    const company = read("client/src/lib/companyContacts.ts");
    const contact = read("client/src/pages/Contact.tsx");
    expect(company).toContain("yaoundeWhatsapp");
    expect(company).toContain("yaoundePhone");
    expect(company).toContain("sur rendez-vous uniquement");
    expect(contact).toContain("Ligne fixe Yaoundé");
    expect(contact).toContain("WhatsApp Yaoundé");
    expect(contact).toContain("Canal principal");
    expect(contact).toContain("distinct du WhatsApp");
    expect(composePublicPrerender(shell, "/contact").html).toContain("sur rendez-vous");
  });

  it("documente le SLA 24 h ouvrées près de l’évaluation", () => {
    const form = read("client/src/components/SimpleMultiProjectForm.tsx");
    const company = read("client/src/lib/companyContacts.ts");
    expect(form).toContain("première réponse humaine");
    expect(form).toContain("jours ouvrés Yaoundé");
    expect(company).toContain("responseSla");
    expect(company).toContain("sous 24 heures ouvrées");
  });

  it("prerender la politique de confidentialité avec accès et conservation concrets", () => {
    const html = composePublicPrerender(shell, "/politique-confidentialite").html;
    expect(html).toContain("Qui consulte vos documents");
    expect(html).toContain("jusqu’à 5 ans");
    expect(html).toContain("partenaires B2B");
    expect(html).not.toMatch(/Les données sensibles sont limitées aux finalités/);
  });

  it("purge le service worker (cache PWA bumpé)", () => {
    expect(read("client/public/sw.js")).toMatch(/3m-travel-pwa-v\d+/);
  });
});
