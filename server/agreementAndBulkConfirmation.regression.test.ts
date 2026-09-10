import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("protocole et confirmation des changements groupés", () => {
  it("affiche une erreur réarmable dans le protocole client", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AgreementProtocol.tsx"), "utf8");
    expect(source).toContain("signError");
    expect(source).toContain("Signature non enregistrée");
    expect(source).toContain("setIsSigning(false)");
  });

  it("exige une confirmation récapitulative avant la mutation groupée", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");
    expect(source).toContain("showPendingSaveConfirm");
    expect(source).toContain("Confirmer l’enregistrement groupé");
    expect(source).toContain("Confirmer et enregistrer");
    expect(source).toContain("void saveInlineChanges()");
  });
});

