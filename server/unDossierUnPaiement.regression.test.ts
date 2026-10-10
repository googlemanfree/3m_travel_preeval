import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

/**
 * Règle métier : 1 dossier = 1 paiement ; 2ᵉ dossier = 2ᵉ paiement.
 * Le paiement d’une procédure ne doit jamais débloquer ni étiqueter une sœur.
 */
describe("1 dossier = 1 paiement", () => {
  it("l’espace client calcule paymentConfirmed sur la procédure sélectionnée seulement", () => {
    const candidate = read("server/routers/candidate.ts");
    const block = candidate.slice(
      candidate.indexOf("getClientDashboardSummary:"),
      candidate.indexOf("saveDestinationComparison:"),
    );
    expect(block).toContain("selectedProcedurePaymentConfirmed");
    expect(block).toContain("activeApp.paymentStatus === \"SUCCESS\"");
    expect(block).toContain("activeAgencyDossier.initialPaymentStatus === \"paid\"");
    expect(block).toContain("paymentConfirmed: selectedProcedurePaymentConfirmed");
    expect(block).not.toContain("paymentConfirmed: activeApp?.paymentStatus === \"SUCCESS\" ||");
    expect(block).toContain("activeAgencyDossier:");
  });

  it("l’activation duale reporte chaque frais validé sur sa ligne agence", () => {
    const admin = read("server/routers/adminCandidateManagement.ts");
    const block = admin.slice(
      admin.indexOf("activatePreDossierAccount:"),
      admin.indexOf("  list: publicProcedure"),
    );
    expect(block).toContain("Le second paiement d'ouverture doit être validé avant d'ajouter la seconde procédure");
    expect(block).toContain("initialPaymentStatus: \"paid\"");
    expect(block).toContain("second frais d’ouverture validé");
    // Les deux inserts / l’update portent le statut payé (pas seulement le premier).
    expect(block.match(/initialPaymentStatus:\s*"paid"/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("l’import saisit le paiement de CE dossier sans hériter d’un frère", () => {
    const admin = read("server/routers/admin.ts");
    const block = admin.slice(
      admin.indexOf("importAgencyDossier:"),
      admin.indexOf("importAgencyDossier:") + 2500,
    );
    expect(block).toContain("initialPaymentStatus: z.enum([\"unknown\", \"pending\", \"paid\"]).default(\"unknown\")");
    expect(block).toContain("initialPaymentStatus: input.initialPaymentStatus");
    expect(block).toContain("ne jamais hériter du statut d’un dossier frère");
  });

  it("l’UI client et admin annonce la règle et isole la carte paiement", () => {
    const space = read("client/src/pages/EvaluationSpace.tsx");
    expect(space).toContain("procedurePaymentConfirmed");
    expect(space).toContain("paymentDossierNumber");
    expect(space).toContain('data-testid="per-dossier-payment-reminder"');
    expect(space).toContain("1 dossier = 1 paiement");
    expect(space).not.toContain('paymentConfirmed: String((cProfile as any).paymentStatus ?? "").toUpperCase() === "SUCCESS" || (cProfile as any).initialPaymentStatus === "paid"');

    const card = read("client/src/components/DossierPaymentCard.tsx");
    expect(card).toContain("Ce règlement ne couvre que ce dossier");
    expect(card).toContain("second paiement distinct");

    const panel = read("client/src/components/AdminPreDossierAccountsPanel.tsx");
    expect(panel).toContain("1 dossier = 1 paiement");
    expect(panel).toContain("le premier paiement ne débloque pas la seconde procédure");

    const board = read("client/src/components/AdminSimultaneousProceduresBoard.tsx");
    expect(board).toContain("1 dossier = 1 paiement");

    const importForm = read("client/src/pages/AdminDashboard.tsx");
    expect(importForm).toContain("ce dossier uniquement");
    expect(importForm).toContain("1 dossier = 1 paiement");
  });
});
