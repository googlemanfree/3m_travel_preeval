import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveActiveDossierNumber } from "../shared/activeDossier";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("dossier de traitement actif synchronisé", () => {
  it("priorise la sélection puis la persistance, sinon le payé puis le plus récent", () => {
    const dossiers = [
      { dossierNumber: "EVAL-DRAFT-2026-AAA", paymentStatus: "PENDING", createdAt: "2026-01-01T00:00:00Z" },
      { dossierNumber: "EVAL-DRAFT-2026-BBB", paymentStatus: "SUCCESS", createdAt: "2026-02-01T00:00:00Z" },
      { dossierNumber: "3M-AGN-0009", paymentStatus: "PENDING", createdAt: "2026-03-01T00:00:00Z" },
    ];
    expect(resolveActiveDossierNumber({ dossiers, selectedDossierNumber: "3M-AGN-0009" })).toBe("3M-AGN-0009");
    expect(resolveActiveDossierNumber({ dossiers, persistedActiveDossierNumber: "EVAL-DRAFT-2026-AAA" })).toBe("EVAL-DRAFT-2026-AAA");
    expect(resolveActiveDossierNumber({ dossiers })).toBe("EVAL-DRAFT-2026-BBB");
  });

  it("persiste l’activation client, marque le dossier actif admin et annule les paiements validés", () => {
    const candidate = read("server/routers/candidate.ts");
    const application = read("server/routers/application.ts");
    const admin = read("server/routers/admin.ts");
    const space = read("client/src/pages/EvaluationSpace.tsx");
    const payments = read("client/src/components/AdminPaymentManagement.tsx");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    const stepper = read("client/src/components/ProcedureStepper.tsx");
    const migration = read("drizzle/0077_candidate_active_dossier.sql");

    expect(migration).toContain("activeDossierNumber");
    expect(candidate).toContain("setActiveDossier:");
    expect(candidate).toContain("activeTreatmentDossierNumber");
    expect(candidate).toContain("resolveActiveDossierNumber");
    expect(application).toContain("activeDossierNumber: dossierNumber");
    expect(admin).toContain("isClientActiveTreatment");
    expect(admin).toContain("cancelValidatedDossierPayment:");
    expect(admin).not.toContain("provisionalAccountEmails");
    expect(space).toContain("activateDossier");
    expect(space).toContain("setActiveDossier");
    expect(space).toContain("client-active-dossier-tab");
    expect(payments).toContain("cancel-validated-payment");
    expect(dashboard).toContain("open-cancel-validated-payment");
    expect(dashboard).toContain("cancel-last-kanban-step");
    expect(dashboard).toContain("admin-active-treatment-badge");
    expect(stepper).toContain("cancel-last-past-step");
    expect(stepper).toContain("Annuler l’étape");
  });
});
