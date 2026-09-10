import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const candidate360 = readFileSync(resolve(process.cwd(), "client/src/components/Candidate360Workspace.tsx"), "utf8");
const placement = readFileSync(resolve(process.cwd(), "client/src/components/AdminPlacementPipeline.tsx"), "utf8");
const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/AdminDashboard.tsx"), "utf8");

describe("retours visuels du Pilotage admin", () => {
  it("réarme les actions Candidate360 après succès et erreur", () => {
    for (const key of ["deadline", "checklist", "clarificationDeadline", "message", "approveReceipt", "paymentReceipt"]) {
      expect(candidate360).toContain(`unlockAction(\"${key}\")`);
    }
    expect(candidate360).toContain("toast.error(\"Envoi impossible\"");
    expect(candidate360).toContain("toast.error(\"Échéance impossible à enregistrer\"");
  });

  it("protège les actions placement contre le double clic et expose les erreurs", () => {
    for (const key of ["organization", "profile", "submission", "employerAccess"]) {
      expect(placement).toContain(`lockedActions.${key}`);
      expect(placement).toContain(`lockAction(\"${key}\")`);
      expect(placement).toContain(`unlockAction(\"${key}\")`);
    }
  });

  it("conserve les retours succès/erreur de la décision et du paiement", () => {
    expect(dashboard).toContain("Statut mis à jour");
    expect(dashboard).toContain("Erreur");
    expect(dashboard).toContain("Paiement déjà confirmé");
    expect(dashboard).toContain("Validation du paiement impossible");
  });
});
