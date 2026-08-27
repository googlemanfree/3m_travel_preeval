import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeDossierReference, parseAgencyDossierReference } from "./utils/dossierReference";

describe("normalisation et vérification de références de dossier", () => {
  it("accepte les espacements et les anciens formats agence sans changer leur identité", () => {
    expect(normalizeDossierReference(" 3m 2026 7 ")).toBe("3M-2026-0007");
    expect(normalizeDossierReference("3m-ag-19")).toBe("3M-AGN-0019");
    expect(normalizeDossierReference("eval draft 2026 123456")).toBe("EVAL-DRAFT-2026-123456");
    expect(parseAgencyDossierReference("3M-AG-19")).toBe(19);
  });

  it("résout les dossiers agence dans le suivi public sans dégrader le contrôle e-mail", () => {
    const source = readFileSync(resolve(import.meta.dirname, "routers/application.ts"), "utf8");
    expect(source).toContain("parseAgencyDossierReference(input.dossierNumber)");
    expect(source).toContain("Les informations de suivi ne correspondent à aucun dossier accessible.");
  });

  it("réserve le diagnostic complet au rôle administrateur et enregistre un audit minimal", () => {
    const source = readFileSync(resolve(import.meta.dirname, "routers/dossierVerification.ts"), "utf8");
    expect(source).toContain("requireAdminSessionFromCookie");
    expect(source).toContain('action: "dossier_reference_checked"');
    expect(source).not.toContain("fullName:");
  });

  it("laisse le formulaire de suivi accessible sans compte, avec le contrôle serveur numéro et e-mail", () => {
    const appSource = readFileSync(resolve(import.meta.dirname, "../client/src/App.tsx"), "utf8");
    expect(appSource).toContain('<Route path={"/mon-dossier"} component={MonDossier} />');
    expect(appSource).not.toContain('path={"/mon-dossier"}>\n        <AuthGuard');
  });
});
