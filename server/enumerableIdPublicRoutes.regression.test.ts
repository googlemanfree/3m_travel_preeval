import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/**
 * Les identifiants séquentiels (`translationRequests.id`, `applications.id`) et le numéro de dossier
 * `3M-AAAA-NNNN` sont énumérables : aucune procédure publique ne doit s'en servir comme seule preuve d'accès,
 * et surtout pas pour écrire un état de paiement ou de signature.
 */
describe("procédures publiques à identifiant énumérable", () => {
  it("translation : ni validation de paiement ni téléchargement publics", () => {
    const source = read("server/routers/translation.ts");
    expect(source).not.toMatch(/\bvalidateTranslationPayment\s*:/);
    expect(source).not.toMatch(/\bdownloadTranslatedDocument\s*:/);
    // Ce que le client utilise réellement reste en place.
    expect(source).toMatch(/\bcreateTranslationRequest\s*:/);
    expect(source).toMatch(/\bgetTranslationPricing\s*:/);
  });

  it("userDashboard : plus de lecture publique par numéro de dossier, composant orphelin retiré", () => {
    const source = read("server/routers/userDashboard.ts");
    expect(source).not.toMatch(/\bgetPaymentHistory\s*:/);
    expect(source).not.toMatch(/\bgetDossierOverview\s*:/);
    expect(source).not.toContain("publicProcedure");
    expect(existsSync(resolve(root, "client/src/components/DossierOverview.tsx"))).toBe(false);
  });

  it("application.signAgreement est réservée au propriétaire du dossier", () => {
    const source = read("server/routers/application.ts");
    const start = source.indexOf("signAgreement: candidateProcedure");
    expect(start, "signAgreement doit être une candidateProcedure").toBeGreaterThan(-1);
    const body = source.slice(start, start + 900);
    expect(body).toContain("ctx.candidate.id");
    expect(body).toContain("ctx.candidate.email");
    expect(source).not.toMatch(/signAgreement:\s*publicProcedure/);
  });

  it("flights.getSearchHistory et clientDocuments.submitPayment publiques ont été retirées", () => {
    expect(read("server/routers/flights.ts")).not.toMatch(/\bgetSearchHistory\s*:/);
    expect(read("server/routers/clientDocuments.ts")).not.toMatch(/\bsubmitPayment\s*:/);
  });
});
