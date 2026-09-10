import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("tableau dossiers — contrôles inline groupés et corbeille", () => {
  it("utilise les menus Select portaled plutôt que les selects natifs inopérants", () => {
    const source = read("client/src/pages/AdminDashboard.tsx");
    expect(source).toContain("<Select value={paymentStatus} onValueChange=");
    expect(source).toContain("<SelectContent className=\"z-[120]\">");
    expect(source).toContain("<Select value={procedureStep} onValueChange=");
    expect(source).not.toContain("<select aria-label={`Modifier le statut du paiement");
  });

  it("ne persiste les changements qu’après le bouton central d’enregistrement", () => {
    const source = read("client/src/pages/AdminDashboard.tsx");
    expect(source).toContain("pendingInlineChanges");
    expect(source).toContain("Enregistrer les modifications");
    expect(source).toContain("saveInlineChanges");
    expect(source).toContain("Les badges marqués « à enregistrer »");
  });

  it("expose un accès à la corbeille réversible existante", () => {
    const source = read("client/src/pages/AdminDashboard.tsx");
    expect(source).toContain("Corbeille / doublons");
    expect(source).toContain("/admin/agency-dossiers?showTrash=false");
    const trash = read("client/src/pages/AdminAgencyDossiers.tsx");
    expect(trash).toContain("showTrash");
    expect(trash).toContain("restoreMutation");
    expect(trash).toContain("Tapez SUPPRIMER pour confirmer");
  });
});
