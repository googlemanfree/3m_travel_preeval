import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "server/routers/application.ts"), "utf8");

const procedureBody = (name: string) => {
  const start = source.indexOf(`${name}: publicProcedure`);
  expect(start, `${name} introuvable`).toBeGreaterThan(-1);
  return source.slice(start, source.indexOf("\n    }),", start));
};

/**
 * Le numéro de dossier `3M-AAAA-NNNN` ne compte que 10 000 valeurs par an : n'importe qui peut les énumérer.
 * Les pages de paiement publiques n'ont besoin que de quelques champs ; la ligne entière de `applications`
 * (passeport, CV, date de naissance, revenus, notes admin, empreinte du code secret de paiement) ne doit
 * jamais sortir par une procédure publique.
 */
describe("application : lectures publiques de dossiers", () => {
  it("getApplicationByDossierNumber ne renvoie qu'une liste blanche de colonnes", () => {
    const body = procedureBody("getApplicationByDossierNumber");
    expect(body).not.toContain(".select()");
    expect(body).toContain(".select({");
    for (const sensitive of ["paymentSecretCodeHash", "passportUrl", "cvUrl", "dateOfBirth", "adminNote", "bankBalance", "monthlyIncome", "documentsUrls"]) {
      expect(body, sensitive).not.toContain(sensitive);
    }
  });

  it("les lectures publiques sans appelant ont été retirées", () => {
    for (const name of ["getMyApplications", "getAIReportHistory", "getAIReport"]) {
      expect(source, name).not.toMatch(new RegExp(`\\b${name}\\s*:`));
    }
  });
});
