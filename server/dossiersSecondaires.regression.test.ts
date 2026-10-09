import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("dossiers secondaires travail + études", () => {
  it("expose le dialogue de seconde opportunité côté espace client", () => {
    const page = read("client/src/pages/EvaluationSpace.tsx");
    expect(page).toContain("Ajouter une seconde opportunité (Travail / Études)");
    expect(page).toContain('data-testid="secondary-dossier-dialog"');
    expect(page).toContain("secondaryDossierEvaluationPath");
    expect(page).toContain("SECONDARY_PROJECT_OPTIONS");
  });

  it("inclut les dossiers agence dans la liste client et rattache les sœurs côté admin", () => {
    const candidate = read("server/routers/candidate.ts");
    expect(candidate).toContain("agencyDossierRows");
    expect(candidate).toContain('source: "agency" as const');
    expect(candidate).toContain("selectedAgency");

    const admin = read("server/routers/admin.ts");
    expect(admin).toContain("attachSiblingProcedures");

    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(dashboard).toContain('data-testid="admin-sibling-dossiers"');
    expect(dashboard).toContain("siblingProcedures");
    expect(dashboard).toContain("procédures · même client");
  });
});
