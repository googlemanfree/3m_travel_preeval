import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("remise validée d’évaluation pré-dossier", () => {
  it("exige une validation humaine puis livre dans l’espace client et par e-mail", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("deliverValidatedEvaluation");
    expect(router).toContain("confirmed: z.literal(true)");
    expect(router).toContain('evaluationDeclarationStatus !== "validated"');
    expect(router).toContain("clientNotifications");
    expect(router).toContain("candidateMessages");
    expect(router).toContain("sendClientNotificationEmail");
  });

  it("ouvre l’éditeur partagé avant toute remise dans le panneau admin", () => {
    const panel = read("client/src/components/AdminPreDossierEvaluationPanel.tsx");
    expect(panel).toContain("Saisir et envoyer l’évaluation manuellement");
    expect(panel).toContain("onOpenEditor");
    expect(panel).toContain("Ouvrez l’espace de préparation complet");
    expect(panel).not.toContain("onDeliver");
  });
});
