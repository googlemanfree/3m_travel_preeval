import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildEvaluationResponseTemplate } from "./services/evaluationResponseTemplates";
import {
  bilanStructuresForKind,
  messageTemplatesForKind,
} from "../shared/evaluationBilanTemplates";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("bilan d’évaluation dynamique + envoi unique", () => {
  it("expose le type de projet dans getEvaluationDelivery et le serialiseur", () => {
    const router = read("server/routers/unifiedRequests.ts");
    expect(router).toContain("projectKind");
    expect(router).toContain("resolveEvaluationProjectKind");
    expect(router).toContain("visaType: application.visaType ?? null");
    expect(router).toContain("validé et envoyé immédiatement dans l’espace client et par e-mail.");
    expect(router).toContain("Type de visa utilisé");
  });

  it("adapte l’éditeur admin au kind et propose un bouton unique espace + e-mail", () => {
    const editor = read("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(editor).toContain("bilanStructuresForKind");
    expect(editor).toContain("messageTemplatesForKind");
    expect(editor).toContain("EVALUATION_KIND_LABELS");
    expect(editor).toContain("evaluation-project-kind");
    expect(editor).toContain("Valider et envoyer (espace + e-mail)");
    expect(editor).toContain("Bilan envoyé (espace client + e-mail)");
    expect(editor).toContain("Champ de saisie complet");
  });

  it("résout les modèles de réponse via resolveEvaluationProjectKind (pas un match exact)", () => {
    const etudes = buildEvaluationResponseTemplate("canada_etude", {
      fullName: "Awa",
      destinationCountry: "Canada",
    });
    expect(etudes).toContain("Bonjour Awa");
    expect(etudes).toMatch(/études|académique/i);

    const travail = buildEvaluationResponseTemplate("schengen_travail", {
      fullName: "Jean",
      destinationCountry: "Luxembourg",
    });
    expect(travail).toContain("Bonjour Jean");
    expect(travail).toMatch(/professionnel|CV/i);
  });

  it("différencie clairement les structures études / travail / visiteurs", () => {
    expect(bilanStructuresForKind("etudes").favorable?.strengths).toMatch(/académique|cycle/i);
    expect(bilanStructuresForKind("travail").favorable?.recommendations).toMatch(/CV/i);
    expect(bilanStructuresForKind("tourisme").improvement?.weaknesses).toMatch(/statut|motif|attaches/i);
    expect(messageTemplatesForKind("etudes").canada?.subject).toMatch(/études/i);
    expect(messageTemplatesForKind("travail").canada?.subject).toMatch(/travail/i);
  });
});
