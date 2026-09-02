import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildEvaluationResponseTemplate, getEvaluationResponseTemplates } from "./services/evaluationResponseTemplates";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("pilotage administratif des évaluations 2026", () => {
  it("propose des modèles neutres par projet, toujours destinés à la relecture", () => {
    const templates = getEvaluationResponseTemplates();
    expect(templates.map((template) => template.key)).toEqual(["travail", "etudes", "tourisme"]);
    const draft = buildEvaluationResponseTemplate("travail", { fullName: "Samira", destinationCountry: "Luxembourg" });
    expect(draft).toContain("Bonjour Samira");
    expect(draft).toContain("sources officielles");
    expect(draft).not.toMatch(/visa garanti|emploi garanti|admission garantie/i);
  });

  it("protège la relance de brouillon par session, motif, consentement et événement d’audit", () => {
    const source = read("server/routers/aiEvaluationManagement.ts");
    expect(source).toContain("retryEvaluationPreparation");
    expect(source).toContain("requireValidAdminSession(input.sessionToken)");
    expect(source).toContain("preparatoryAnalysisConsent !== true");
    expect(source).toContain('action: "preparation_restarted"');
    expect(source).toContain('action: "preparation_retry_unavailable"');
    expect(source).toContain("if (evaluation.reviewedAt)");
    expect(source).not.toContain("cvFileUrl: evaluation.cvFileUrl");
  });

  it("calcule des indicateurs de revue réels autour de la cible de 24 heures", () => {
    const source = read("server/routers/aiEvaluationManagement.ts");
    expect(source).toContain("targetHours: 24");
    expect(source).toContain("reviewedWithinTarget");
    expect(source).toContain("averageReviewHours");
    expect(source).toContain("return { items: items.slice(0, input.limit), summary, reviewSla }");
  });

  it("présente la grille Luxembourg comme repère interne à vérifier, jamais comme une exclusion automatique", () => {
    const router = read("server/routers/aiEvaluationManagement.ts");
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(router).toContain("Pré-requis internes déclarés à vérifier");
    expect(router).toContain("aucune exclusion ni réorientation n’est automatique");
    expect(dashboard).toContain("Vérifier la procédure officielle Guichet.lu");
    expect(dashboard).toContain("Délais de revue — objectif");
  });

  it("sépare la préparation IA de la validation humaine et de la diffusion", () => {
    const source = read("server/routers/aiEvaluationManagement.ts");
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(source).toContain("generateGeminiEvaluationDraft");
    expect(source).toContain("if (!evaluation.reviewDraft?.trim())");
    expect(source).toContain("sendValidatedEvaluationResponseEmail");
    expect(dashboard).toContain("L’IA prépare uniquement une proposition");
    expect(dashboard).toContain("validation humaine requise");
  });

  it("conserve le consentement pour la préparation automatique côté soumission", () => {
    const source = read("server/routers/evaluation.ts");
    expect(source).toContain("if (input.geminiAnalysisConsent)");
    expect(source).toContain("preparatoryAnalysisConsentRecordedAt");
    expect(source).toContain("aiReportContent: JSON.stringify(draft)");
  });
});

  it("exige un second conseiller distinct et expose le filtre dédié", () => {
    const source = read("server/routers/aiEvaluationManagement.ts");
    const dashboard = read("client/src/pages/AdminAIEvaluationDashboard.tsx");
    expect(source).toContain("secondValidateEvaluationResponse");
    expect(source).toContain("evaluation.reviewedBy.toLowerCase() === admin.email.toLowerCase()");
    expect(dashboard).toContain("secondReviewOnly");
    expect(dashboard).toContain("Secondes validations en attente");
  });

    it("affiche une timeline candidate alimentée par l’historique des statuts", () => {
    const source = read("client/src/pages/EvaluationSpace.tsx");
    expect(source).toContain("validatedSteps");
    expect(source).toContain("Étapes validées récemment");
    expect(source).toContain("candidateCase?.history");
  });

describe("reprise et aperçu du bilan", () => {
  it("expose le contenu sérialisé des versions et le contrôle de reprise côté éditeur", () => {
    const router = read("server/routers/unifiedRequests.ts");
    const editor = read("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(router).toContain("contentJson: evaluationBilanVersions.contentJson");
    expect(editor).toContain("const resumeVersion = (version: any)");
    expect(editor).toContain("Reprendre l’évaluation");
    expect(editor).toContain("setRecommendations(joinLines");
    expect(editor).toContain("lg:flex-row");
    expect(editor).toContain("lg:overflow-hidden");
    expect(editor).toContain("min-w-[560px]");
    expect(editor).not.toContain("sm:grid-cols-4");
  });

  it("tolère l’indisponibilité de la table legacy sans bloquer le pilotage", () => {
    const router = read("server/routers/unifiedRequests.ts");
    expect(router).toContain("async function loadLegacyProfileEvaluations");
    expect(router).toContain("continuing with primary sources");
    expect(router).toContain("loadLegacyProfileEvaluationsForEmail(db, source.email)");
    expect(router).not.toContain("db.select().from(profileEvaluations).orderBy(desc(profileEvaluations.createdAt)).limit(200),");
  });

  it("génère un aperçu e-mail en lecture seule sans appeler la diffusion", () => {
    const router = read("server/routers/unifiedRequests.ts");
    const editor = read("client/src/components/EvaluationDeliveryEditor.tsx");
    expect(router).toContain("previewEvaluationDeliveryEmail: publicProcedure");
    expect(router).toContain("return {\n        recipient:");
    const previewBlock = router.slice(router.indexOf("previewEvaluationDeliveryEmail"), router.indexOf("previewEvaluationDeliveryPdf"));
    expect(previewBlock).not.toContain("sendEmail(");
    expect(editor).toContain("sandbox=\"\" srcDoc={emailPreview.html}");
    expect(editor).toContain("Destinataire :");
    expect(editor).toContain("Objet :");
    expect(editor).toContain("isLoading ?");
    expect(editor).not.toContain("isLoading || isFetching ?");
  });
});

