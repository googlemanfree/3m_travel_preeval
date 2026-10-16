import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildMailtoRelance,
  buildWhatsAppRelance,
  templateForStage,
} from "../shared/adminOpsToolkit";
import {
  evaluationGapReminder,
  resolveEvaluationProjectKind,
} from "../shared/evaluationVisaCv";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("relances admin différenciées par type de visa", () => {
  it("adapte évaluation manquante et pièces selon travail / études / visiteurs", () => {
    const travail = templateForStage("evaluation_missing", "travail");
    expect(travail.body.toLowerCase()).toContain("cv");
    expect(travail.subject.toLowerCase()).toMatch(/travail|cv/);

    const etudes = templateForStage("evaluation_missing", "etudes");
    expect(etudes.body.toLowerCase()).toMatch(/diplôme|releve|cycle/);
    expect(etudes.body.toLowerCase()).not.toContain("cv actualisé");

    const visiteurs = templateForStage("documents_pending", "visiteur");
    expect(visiteurs.body.toLowerCase()).toMatch(/chef d’entreprise|employé|particulier|statut/);

    const mailto = buildMailtoRelance({
      email: "a@test.com",
      name: "Aïcha",
      reference: "3M-001",
      stage: "documents_pending",
      visaType: "canada_etude",
    });
    expect(decodeURIComponent(mailto).toLowerCase()).toMatch(/diplôme|relevé/);

    const wa = buildWhatsAppRelance({
      phone: "698104832",
      name: "Paul",
      reference: "3M-002",
      stage: "evaluation_missing",
      projectType: "tourisme",
    });
    expect(wa).toContain("wa.me");
    expect(decodeURIComponent(wa!).toLowerCase()).toMatch(/statut|visiteur/);
  });

  it("fournit des relances pièces distinctes (CV / études / visiteurs)", () => {
    expect(evaluationGapReminder("travail", "Sam").body).toMatch(/CV/i);
    expect(evaluationGapReminder("etudes", "Léa").body).toMatch(/diplôme|relevé|cycle/i);
    expect(evaluationGapReminder("tourisme", "Marc").body).toMatch(/statut|chef d’entreprise|employé|particulier/i);
    expect(resolveEvaluationProjectKind("schengen_travail")).toBe("travail");
    expect(resolveEvaluationProjectKind("schengen_tourisme")).toBe("tourisme");
  });

  it("passe le visaType au composeur serveur (relance dynamique) et aux modèles 360", () => {
    const router = read("server/routers/adminCandidateManagement.ts");
    expect(router).toContain("visaType: account.visaType");
    expect(router).toContain("visaType: app.visaType");
    expect(router).toContain("sendDynamicRelance");
    expect(router).toContain("composeDynamicRelance");
    expect(router).toContain("visaType");
    expect(router).toContain("projectType: visaType");

    const cockpit = read("client/src/components/AdminCockpitControlBoard.tsx");
    expect(cockpit).toContain("sendDynamicRelance");
    expect(cockpit).toContain("Envoyer e-mail");

    const workspace = read("client/src/components/Candidate360Workspace.tsx");
    expect(workspace).toContain("templateForStage");
    expect(workspace).toContain("visaTypeDraft");

    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(dashboard).toContain("evaluation-gap-remind-email");
    expect(dashboard).toContain("gapReminderLabel");
  });
});
