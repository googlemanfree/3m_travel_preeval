import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => readFileSync(resolve(root, file), "utf8");

describe("suivi de dossier prudent", () => {
  it("n’énumère pas les dossiers à partir d’erreurs distinctes", () => {
    const router = read("server/routers/application.ts");
    const genericMessage = "Les informations de suivi ne correspondent à aucun dossier accessible.";
    expect(router.match(new RegExp(genericMessage.replace(/[.]/g, "\\."), "g"))?.length).toBeGreaterThanOrEqual(2);
    expect(router).not.toContain("Email incorrect pour ce dossier.");
  });

  it("ne retourne aucun lien de document privé, note interne ou score dans la vue publique de suivi", () => {
    const router = read("server/routers/application.ts");
    const section = router.slice(router.indexOf("getDossierStatus:"), router.indexOf("sendCandidateMessage:"));
    expect(section).not.toContain("passportUrl:");
    expect(section).not.toContain("cvUrl:");
    expect(section).not.toContain("diplomaUrl:");
    expect(section).not.toContain("adminNote:");
    expect(section).not.toContain("scoringTotal:");
  });

  // TODO-VERIFY: legacy feature not found in EvaluationSpace.tsx after MonDossier.tsx removal — confirm intentionally dropped or re-add.
  // EvaluationSpace.tsx requires normal candidate authentication (useCandidateAuth) rather than
  // auto-deriving credentials from an associated dossier reference; getMyDossierData is no longer
  // called via useQuery anywhere client-side, and no setCredentials({ dossierNumber, email }) call
  // for an "associatedDossierNumber" could be found in the current codebase.
  it("ouvre le dossier lié pour un client connecté sans mettre son e-mail dans l’URL", () => {
    const page = read("client/src/pages/EvaluationSpace.tsx");
    const navigation = read("client/src/components/ClientSpaceNavigation.tsx");
    expect(page).toContain("trpc.candidate.getMyDossierData.useQuery");
    expect(page).toContain("setCredentials({ dossierNumber: associatedDossierNumber, email: associatedEmail })");
    expect(navigation).toContain('label: "Mon dossier"');
    expect(navigation).not.toContain("/mon-dossier?email=");
  });
});
