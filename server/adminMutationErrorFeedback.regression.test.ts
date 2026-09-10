import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const adminDashboard = readFileSync(new URL("../client/src/pages/AdminDashboard.tsx", import.meta.url), "utf8");
const candidate360 = readFileSync(new URL("../client/src/components/Candidate360Workspace.tsx", import.meta.url), "utf8");

describe("retour utilisateur des mutations admin", () => {
  it("affiche l’erreur serveur d’activation dans le toast et la modale", () => {
    expect(adminDashboard).toContain('title: "Activation impossible"');
    expect(adminDashboard).toContain("setPreDossierActivationError(message)");
    expect(adminDashboard).toContain('role="alert"');
  });

  it("conserve un handler d’erreur explicite pour paiement, évaluation et protocole", () => {
    expect(adminDashboard).toContain('title: "Validation du paiement impossible"');
    expect(candidate360).toContain('toast.error("Validation hors ligne impossible"');
    expect(candidate360).toContain('toast.error("Envoi du protocole impossible"');
    expect(candidate360).toContain('toast.error("Validation du reçu impossible"');
  });
});
