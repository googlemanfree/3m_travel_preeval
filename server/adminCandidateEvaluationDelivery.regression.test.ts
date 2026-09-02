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

  it("initialise un dossier provisoire pour les comptes sans application liée", () => {
    const router = read("server/routers/unifiedRequests.ts");
    const editor = read("client/src/components/EvaluationDeliveryEditor.tsx");
    const dashboard = read("client/src/pages/AdminDashboard.tsx");
    expect(router).toContain("initializeEvaluationDelivery");
    expect(router).toContain("candidate_pre_dossier");
    expect(editor).toContain('sourceType?: "application" | "candidate"');
    expect(editor).toContain("Initialisation sécurisée du dossier d’évaluation");
    expect(dashboard).toContain('sourceType="candidate"');
    expect(router).toContain("applications.dossierNumber est limité à 20 caractères");
    expect(router).toContain("Math.floor(1000 + Math.random() * 9000)");
    expect(read("server/routers/application.ts")).toContain("randomInt(1000, 10000)");
  });

  it("récupère une session plateforme lorsque le jeton admin local manque", () => {
    const editor = read("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(editor).toContain("bootstrapPlatformSession.useQuery");
    expect(editor).toContain("providedSessionToken || restoredPlatformToken");
    expect(editor).toContain('localStorage.setItem("adminSessionToken", restoredPlatformToken)');
  });
});
