import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("pilotage paiement, activation et étapes officielles", () => {
  it("expose un filtre admin explicite pour les paiements en attente de validation", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminPaymentManagement.tsx"), "utf8");
    expect(source).toContain('<option value="PENDING">En attente de validation</option>');
  });

  it("affiche une progression client basée sur les états réels du dossier", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/MySpace.tsx"), "utf8");
    expect(source).toContain("Progression de l’activation");
    expect(source).toContain("evaluationClientConfirmedAt");
    expect(source).toContain("activationRequestedAt");
    expect(source).toContain('paymentStatus === "SUCCESS"');
    expect(source).toContain('role="progressbar"');
  });

  it("conserve le formulaire admin de gestion des étapes avec portail officiel et étapes", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/components/AdminEvisaCatalogueManager.tsx"), "utf8");
    expect(source).toContain("Ajouter un pays");
    expect(source).toContain("Portail officiel HTTPS");
    expect(source).toContain("Étapes de procédure (une ligne par étape)");
  });
});
